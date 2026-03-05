import { Router } from "express";
import { catchAsync } from "../util/catchAsync.js";
import { validateBody } from "../util/validation.js";
import { registerSchema } from "../schemas/auth.schema.js";
import { hashPassword } from "../util/passwordHelpers.js";
import { generateToken } from "../util/tokenHelpers.js";

const router = Router();

router.get(
  "/check",
  catchAsync(async (req, res) => {
    // res.sendSuccess("AuthRoutes", { name: "sample data" }, 200);
    res.sendError("Error message", null, 400, "SAMPLE_ERROR");
  }),
);

router.post(
  "/register",
  validateBody(registerSchema),
  catchAsync(async (req, res) => {
    const { name, email, password } = req.body;

    const [existing] = await req.db.query("SELECT id FROM users WHERE email = ?", [email]);

    if (existing && (existing.length !== 0 || existing.id)) {
      res.sendError("Email is already taken, use a different one", null, 409, "DUPLICATE_ENTRY");
    }

    const { hashedPassword, salt } = await hashPassword(password);

    const result = await req.db.query("INSERT INTO users SET ?", {
      name,
      email,
      password: hashedPassword,
      salt: salt,
      status: "active",
    });

    const token = generateToken({ id: result.id });

    res.sendSuccess(
      "Registered Successfully!",
      { user: { id: result.id, name: result.name, email: result.name }, token },
      201,
    );

    // res.sendSuccess("Registered!", { name, email, password }, 201);
  }),
);

export default router;
