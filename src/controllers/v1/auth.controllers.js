import { Router } from "express";
import nodemailer from "nodemailer";

import catchAsync from "../../util/catchAsync.js";
import { validateBody } from "../../util/validation.js";
import { forgotPasswordSchema, loginSchema, registerSchema } from "../../schemas/auth.schema.js";
import { comparePassword, hashPassword } from "../../util/passwordHelpers.js";
import { generateToken, generatePasswordToken, hashPasswordToken } from "../../util/tokenHelpers.js";
import { loginLimiter, registerLimiter } from "../../middlewares/rateLimiters.js";
import { ERROR_CODES } from "../../util/APIError.js";
import authenticate from "../../middlewares/authenticate.js";
import generateUUID from "../../util/generateUUID.js";
import * as authService from "../../services/authService.js";

//Test imports
import * as userRepository from "../../repository/userRepository.js";

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
    const result = await authService.login(req.body, req.db);

    res.sendSuccess("Logged In Successfully", result, 200);
  }),
);

//POST - /register Auth controller for user Registrations
router.post(
  "/register",
  registerLimiter,
  validateBody(registerSchema),
  catchAsync(async (req, res) => {
    const result = await authService.register(req.body, req.db);

    res.sendSuccess("Registered Successfully!", result, 201);
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
  //Add a limiter on how often this endpoint can be called
  validateBody(forgotPasswordSchema),
  catchAsync(async (req, res) => {
    await authService.forgotPassword(req.body, req.db);
    res.sendSuccess("If this email exists, a reset link has been sent.");
  }),
);

//POST /reset-password - Endpoint for resetting password
router.post(
  "/reset-password",
  catchAsync(async (req, res) => {
    await authService.resetPassword(req.body, req.db);
    res.sendSuccess("Password reset successful");
  }),
);

export default router;
