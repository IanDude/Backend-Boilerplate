import { Router } from "express";

import { catchAsync } from "../../util/catchAsync.js";
import { validateBody } from "../../util/validation.js";
import { loginSchema, registerSchema } from "../../schemas/auth.schema.js";
import { comparePassword, hashPassword } from "../../util/passwordHelpers.js";
import { generateToken } from "../../util/tokenHelpers.js";
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

export default router;
