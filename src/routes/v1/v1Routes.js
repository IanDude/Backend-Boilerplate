import { Router } from "express";
import authRouter from "../../controllers/auth.controllers.js";

const router = Router();

router.use("/auth", authRouter);

export default router;
