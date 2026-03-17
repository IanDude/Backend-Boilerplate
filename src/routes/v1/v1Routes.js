import { Router } from "express";
import authControllers from "../../controllers/v1/auth.controllers.js";
import userControllers from "../../controllers/v1/user.controllers.js";
import uploadControllers from "../../controllers/v1/upload.controllers.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { usersRouteLimiter } from "../../middlewares/rateLimiters.js";

const router = Router();

router.use("/auth", authControllers);
router.use("/users", usersRouteLimiter, authenticate, userControllers);
router.use("/uploads", authenticate, uploadControllers);

export default router;
