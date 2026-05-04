import { Router } from "express";
import nodemailer from "nodemailer";

import { catchAsync } from "../../util/catchAsync.js";
import { validateBody } from "../../util/validation.js";
import { loginSchema, registerSchema } from "../../schemas/auth.schema.js";
import { comparePassword, hashPassword } from "../../util/passwordHelpers.js";
import { generateToken, generatePasswordToken, hashPasswordToken } from "../../util/tokenHelpers.js";
import { loginLimiter, registerLimiter } from "../../middlewares/rateLimiters.js";
import { ERROR_CODES } from "../../util/APIError.js";
import authenticate from "../../middlewares/authenticate.js";
import generateUUID from "../../util/generateUUID.js";

const router = Router();

//Get - /check Test endpoint
router.get(
  "/check",
  authenticate,
  catchAsync(async (req, res) => {
    res.sendSuccess("AuthRoutes", { name: "sample data" }, 200);
  }),
);

//POST - /login Auth controller for user Logins
router.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const [user] = await req.db.query(
      `
      SELECT id, user_uuid, email, password, salt, status
      FROM users WHERE email = ?
      `,
      [email],
    );

    if (!user) {
      return res.sendError("No user found", "Account not found", 404, ERROR_CODES.USER_NOT_FOUND);
    }

    const isPasswordValid = await comparePassword(password, user.password, user.salt);

    if (!isPasswordValid) {
      return res.sendError("Incorrect Password", "Invalid Credentials", 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    const rows = await req.db.query(
      `
      SELECT r.name FROM user_roles ur
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ?;`,
      [user.id],
    );

    const roles = rows.map((role) => role.name);

    const token = generateToken({ user_uuid: user.user_uuid, roles: roles });

    res.sendSuccess(
      "Logged In Successfully",
      { user: { user_uuid: user.user_uuid, email: user.email, status: user.status }, token },
      200,
    );
  }),
);

//POST - /register Auth controller for user Registrations
router.post(
  "/register",
  registerLimiter,
  validateBody(registerSchema),
  catchAsync(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const [existing] = await req.db.query("SELECT email FROM users WHERE email = ?", [email]);

    if (existing && (existing.length !== 0 || existing.email)) {
      res.sendError(
        "Email is already taken, use a different one",
        "Email already exists",
        409,
        ERROR_CODES.DUPLICATE_ENTRY,
      );
    }

    const { hashedPassword, salt } = await hashPassword(password);

    await req.db.query("INSERT INTO users SET ?", {
      user_uuid: generateUUID(),
      first_name: firstName,
      last_name: lastName,
      email,
      password: hashedPassword,
      salt: salt,
      status: "active",
    });
    res.sendSuccess("Registered Successfully!", 201);
  }),
);

//Get - /me Test endpoint for formatting dates from database
router.get(
  "/me",
  authenticate,
  catchAsync(async (req, res) => {
    const { created_at, updated_at } = req.user;
    const formattedCreateDate = new Date(created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" });
    const formattedUpdateDate = new Date(updated_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" });
    req.user.created_at = formattedCreateDate;
    req.user.updated_at = formattedUpdateDate;
    req.user.permissions = Array.from(req.user.permissions);
    res.status(200).json(req.user);
  }),
);

//POST /forgot-password - Endpoint for password recovery
router.post(
  "/forgot-password",
  catchAsync(async (req, res) => {
    const { email } = req.body;

    const [row] = await req.db.query("SELECT user_uuid FROM users WHERE email = ?", [email]);
    if (!row) return res.sendError("If this email exists, a reset link has been sent.");

    const rawToken = generatePasswordToken();
    const hashedToken = hashPasswordToken(rawToken);
    const user_uuid = row.user_uuid;

    //Query to save hashed token to db goes here

    const saveToken = await req.db.query(
      "INSERT INTO password_tokens (user_uuid, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
      [user_uuid, hashedToken],
    );

    if (saveToken.affectedRows === 0) return res.sendError("Failed to insert reset token");

    const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${rawToken}`;

    //Send email using nodemailer
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });

    const template = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6f8;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px;">
          <tr>
            <td align="center">
            <!-- Card -->
            <table width="400" cellpadding="0" cellspacing="0" style="background:#ffffff; padding:24px; border-radius:8px;">
        
          <tr>
            <td>
              <h2 style="margin:0 0 10px;">Reset Your Password</h2>
              <p style="font-size:14px; color:#555;">
                You requested to reset your password. Click the button below to continue.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding:20px 0;">
              <a href="{{RESET_LINK}}" 
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background-color:#111;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:6px;
                  font-size:14px;
                ">
                Reset Password
              </a>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td>
              <p style="font-size:12px; color:#888;">
                If the button doesn’t work, copy and paste this link into your browser:
              </p>
              <p style="font-size:12px; word-break:break-all; color:#555;">
                {{RESET_LINK}}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;">
              <p style="font-size:12px; color:#999;">
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        </td>
        </tr>
      </table>
      </body>
    </html>

    `;

    let message = {
      from: `"Support" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Test Email",
      html: template.replace(/{{RESET_LINK}}/g, resetLink),
    };

    try {
      const info = await transporter.sendMail(message);
      // console.log(info);
      res.sendSuccess("If this email exists, a reset link has been sent.");
    } catch (error) {
      res.sendError("Failed to send email", error);
    }
  }),
);

//POST /reset-password - Endpoint for resetting password
router.post(
  "/reset-password",
  catchAsync(async (req, res) => {
    const { token, newPassword } = req.body;

    const hashedToken = hashPasswordToken(token);

    const [passwordToken] = await req.db.query(
      "SELECT * FROM password_tokens WHERE token_hash = ? AND expires_at > NOW() AND used_at IS NULL",
      [hashedToken],
    );

    // console.log(passwordToken);

    if (passwordToken.length === 0) return res.sendError("Invalid or expired token");

    const hashedPassword = await hashPassword(newPassword);

    const updatePassword = await req.db.query("UPDATE users SET password = ? WHERE user_uuid = ?", [
      hashedPassword,
      passwordToken.user_uuid,
    ]);

    if (updatePassword.affectedRows === 0) return res.sendError("Failed to update password");

    //Invalidate password token to prevent re-use
    const updatePasswordToken = await req.db.query(
      "UPDATE password_tokens SET used_at = NOW() WHERE id = ?",
      passwordToken.id,
    );

    if (updatePasswordToken.affectedRows === 0) return req.sendError("Failed to invalidate password token");

    console.log(passwordToken);

    res.sendSuccess("Password reset successful");
  }),
);

export default router;
