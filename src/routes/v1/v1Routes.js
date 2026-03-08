import { Router } from "express";
import authRouter from "../../controllers/auth.controllers.js";
import { authenticate } from "../../middlewares/authenticate.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/passportTest", authenticate, authRouter);

export default router;
