import { Router } from "express";
import { catchAsync } from "../util/catchAsync.js";
import { validateBody } from "../util/validation.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { comparePassword, hashPassword } from "../util/passwordHelpers.js";
import { generateToken } from "../util/tokenHelpers.js";

const router = Router();

router.get(
  "/check",
  catchAsync(async (req, res) => {
    res.sendSuccess("AuthRoutes", { name: "sample data" }, 200);
    // res.sendError("Error message", null, 400, "SAMPLE_ERROR");
  }),
);

router.post(
  "/register",
  validateBody(registerSchema),
  catchAsync(async (req, res) => {
    const { name, email, password } = req.body;

    const [existing] = await req.db.query("SELECT id FROM users WHERE email = ?", [email]);
    // console.log(existing);

    if (existing && (existing.length !== 0 || existing.id)) {
      res.sendError("Email is already taken, use a different one", "Email already exists", 409, "DUPLICATE_ENTRY");
    }

    const { hashedPassword, salt } = await hashPassword(password);

    const result = await req.db.query("INSERT INTO users SET ?", {
      name,
      email,
      password: hashedPassword,
      salt: salt,
      status: "active",
    });
    // console.log(result);

    const token = generateToken(result.id);

    res.sendSuccess("Registered Successfully!", { user: { id: result.insertId, name, email }, token }, 201);

    // res.sendSuccess("Registered!", { name, email, password }, 201);
  }),
);

router.post(
  "/login",
  validateBody(loginSchema),
  catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const [user] = await req.db.query("SELECT id, email, password, salt, status FROM users WHERE email = ?", [email]);

    if (!user) {
      return res.sendError("No user found", "Account not found", 404, "USER_NOT_FOUND");
    }

    const isPasswordValid = await comparePassword(password, user.password, user.salt);

    if (!isPasswordValid) {
      return res.sendError("Incorrect Password", "Invalid Credentials", 401, "INVALID_CREDENTIALS");
    }

    const token = generateToken(user.id);

    res.sendSuccess(
      "Logged In Successfully",
      { user: { id: user.id, email: user.email, status: user.status }, token },
      200,
    );
  }),
);

router.get(
  "/me",
  catchAsync(async (req, res) => {
    res.status(200).json({ message: "Authorized!" });
  }),
);

export default router;
