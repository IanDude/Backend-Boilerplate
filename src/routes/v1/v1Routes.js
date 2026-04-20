import { Router } from "express";
import authControllers from "../../controllers/v1/auth.controllers.js";
import userControllers from "../../controllers/v1/user.controllers.js";
import fileControllers from "../../controllers/v1/file.controllers.js";
import authenticate from "../../middlewares/authenticate.js";
import { usersRouteLimiter } from "../../middlewares/rateLimiters.js";

const router = Router();

router.use("/auth", authControllers);
router.use("/users", usersRouteLimiter, authenticate, userControllers);
router.use("/files", authenticate, fileControllers);

export default router;
