import { Router } from "express";
import authRouter from "../../controllers/auth.controllers.js";
import userRouter from "../../controllers/user.controllers.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { usersRouteLimiter } from "../../middlewares/rateLimiters.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouteLimiter, authenticate, userRouter);

export default router;
