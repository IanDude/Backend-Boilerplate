import { Router } from "express";
import { catchAsync } from "../../util/catchAsync.js";
import { validateBody, validateParams } from "../../util/validation.js";
import { UserUUIDParamSchema, newUserSchema, updateUserSchema } from "../../schemas/user.schema.js";
import { hashPassword } from "../../util/passwordHelpers.js";
import { idempotencyMiddleware } from "../../middlewares/idempotency.js";
import APIError, { ERROR_CODES } from "../../util/APIError.js";
import generateUUID from "../../util/generateUUID.js";
import authorize from "../../middlewares/authorize.js";
import * as userService from "../../services/userService.js";
import * as userRepository from "../../repository/userRepository.js";

const router = Router();

//GET /users/ or /users - Get all users
router.get(
  "/",
  authorize({
    resource: "user",
    action: "view",
    getResource: async (req) => {
      const users = await userService.getAllUsers(req.db);
      return users;
    },
    ownerField: "id",
  }),
  catchAsync(async (req, res) => {
    const result = req.resource;
    res.sendSuccess("Success", result, 200);
  }),
);

//GET /users/:id - Get a user by UUID
router.get(
  "/:userUUID",
  validateParams(UserUUIDParamSchema),
  authorize({
    resource: "user",
    action: "view",
    getResource: async (req) => {
      const { userUUID } = req.params;
      const user = await userService.getUserByUUID(userUUID, req.db);
      return user;
    },
    ownerField: "id",
  }),
  catchAsync(async (req, res) => {
    const user = req.resource;
    res.sendSuccess("User Found", user, 200);
  }),
);

//POST /users or /users/ - Create a new user
router.post(
  "/",
  validateBody(newUserSchema),
  authorize({
    resource: "user",
    action: "create",
  }),
  catchAsync(async (req, res) => {
    const result = await userService.createNewUser(req.body, req.db);
    res.sendSuccess("User created successfully", result, 201);
  }),
);

//POST /users/register - Create new user with transaction
router.post(
  "/register",
  validateBody(newUserSchema),
  authorize({
    resource: "user",
    action: "create",
  }),
  catchAsync(async (req, res, next) => {
    const connection = await req.db.beginTransaction();
    try {
      await userService.createNewUserTransac(req.body, connection);
      await req.db.commit(connection);

      res.sendSuccess("User created and verified successfully", 201);
    } catch (error) {
      await req.db.rollback(connection);
      res.sendError("Failed to create new user", error, 400, ERROR_CODES.DATABASE_ERROR);
    }
  }),
);

//PUT /users/:id - Update user by UUID

router.put(
  "/:userUUID",
  validateParams(UserUUIDParamSchema),
  validateBody(updateUserSchema),
  authorize({
    resource: "user",
    action: "update",
    getResource: async (req) => {
      const user = await userRepository.findByUUID(req.params.userUUID, req.db);
      return user;
    },
    ownerField: "id",
  }),
  catchAsync(async (req, res) => {
    const user = req.resource;
    await userService.updateUserByUUID(user.user_uuid, req.body, req.db);

    res.sendSuccess("User updated successfully", null, 200);
  }),
);

//DELETE /users/:id
router.delete(
  "/:userUUID",
  validateParams(UserUUIDParamSchema),
  authorize({
    resource: "user",
    action: "delete",
    getResource: async (req) => {
      const user = await userRepository.findByUUID(req.params.userUUID, req.db);
      return user;
    },
  }),
  catchAsync(async (req, res) => {
    const user = req.resource;
    await userService.deleteUserByUUID(user.user_uuid, req.db);
    res.sendSuccess("User deleted successfully", null, 200);
  }),
);

export default router;
