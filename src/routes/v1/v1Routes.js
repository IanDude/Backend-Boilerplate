import { Router } from "express";
import authControllers from "../../controllers/v1/auth.controllers.js";
import userControllers from "../../controllers/v1/user.controllers.js";
import fileControllers from "../../controllers/v1/file.controllers.js";
import roleControllers from "../../controllers/v1/role.controllers.js";
import permissionControllers from "../../controllers/v1/permission.controllers.js";
import authenticate from "../../middlewares/authenticate.js";
import { usersRouteLimiter } from "../../middlewares/rateLimiters.js";

const router = Router();

router.use("/auth", authControllers);
router.use("/users", usersRouteLimiter, authenticate, userControllers);
router.use("/files", authenticate, fileControllers);
router.use("/roles", authenticate, roleControllers);
router.use("/permissions", authenticate, permissionControllers);

export default router;
