import { Router } from "express";
import { catchAsync } from "../../util/catchAsync.js";
import { validateBody, validateParams } from "../../util/validation.js";
import { UserUUIDParamSchema, newUserSchema, updateUserSchema } from "../../schemas/user.schema.js";
import { hashPassword } from "../../util/passwordHelpers.js";
import { idempotencyMiddleware } from "../../middlewares/idempotency.js";
import APIError, { ERROR_CODES } from "../../util/APIError.js";
import generateUUID from "../../util/generateUUID.js";
import authorize from "../../middlewares/authorize.js";

const router = Router();

//GET /users/ or /users - Get all users
router.get(
  "/",
  authorize({
    resource: "user",
    action: "view_all",
  }),
  catchAsync(async (req, res) => {
    const users = await req.db.query(`
      SELECT id, user_uuid, first_name, last_name, email, status, created_at, updated_at
      FROM users`);
    res.sendSuccess("Success", users, 200);
  }),
);

//GET /users/:id - Get a user by ID
router.get(
  "/:userUUID",
  validateParams(UserUUIDParamSchema),
  authorize({
    resource: "user",
    action: "view",
    getResource: async (req) => {
      const { userUUID } = req.params;
      const [row] = await req.db.query(
        `
        SELECT id, user_uuid, first_name, last_name, email, status, created_at, updated_at
        FROM users WHERE user_uuid = ?`,
        [userUUID],
      );
      return row;
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
    const { firstName, lastName, email, status, password } = req.body;
    const userExist = await req.db.query("SELECT user_uuid FROM users WHERE email = ?", [email]);

    if (userExist && (userExist.length > 0 || userExist.id)) {
      return res.sendError(
        "Email is already taken, use a different one",
        "Duplicate Email",
        409,
        ERROR_CODES.DUPLICATE_ENTRY,
      );
    }
    const { hashedPassword, salt } = await hashPassword(password);

    const newUser = {
      user_uuid: generateUUID(),
      first_name: firstName,
      last_name: lastName,
      email,
      password: hashedPassword,
      status: status || "active",
      salt: salt,
    };

    const result = await req.db.query("INSERT INTO users SET ?", newUser);

    if (result.affectedRows === 0) {
      return res.sendError("Failed to create user", 400);
    }

    res.sendSuccess("User created successfully", 201);
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
      const { firstName, lastName, email, password } = req.body;
      const [userExist] = await connection.query("SELECT email FROM users WHERE email = ?", [email]);

      if (userExist && (userExist.length > 0 || userExist.email)) {
        return res.sendError(
          "Email is already taken, use a different one",
          "Duplicate Email",
          409,
          ERROR_CODES.DUPLICATE_ENTRY,
        );
      }

      const { hashedPassword, salt } = await hashPassword(password);
      const newUser = {
        user_uuid: generateUUID(),
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
        status: "pending",
        salt: salt,
      };
      const [insertResult] = await connection.query("INSERT INTO users SET ?", newUser);

      if (insertResult.affectedRows === 0) {
        throw new Error("Failed to create new user");
      }
      const newUserId = insertResult.insertId;
      const [verifiedUser] = await connection.query("UPDATE users SET status = 'verified' WHERE id = ? ", [newUserId]);

      if (!verifiedUser && (verifiedUser.length > 0 || verifiedUser.affectedRows === 0)) {
        throw new Error("Verification Failed");
      }
      await req.db.commit(connection);

      res.sendSuccess("User created and verified successfully", 201);
    } catch (error) {
      await req.db.rollback(connection);
      res.sendError(error);
      next(error);
    }
  }),
);

//PUT /users/:id - Update user by ID

router.put(
  "/:userUUID",
  validateParams(UserUUIDParamSchema),
  validateBody(updateUserSchema),
  authorize({
    resource: "user",
    action: "update",
    getResource: async (req) => {
      const [row] = await req.db.query(
        `
        SELECT id, user_uuid, first_name, last_name, email FROM users WHERE user_uuid = ?
        `,
        [req.params.userUUID],
      );
      return row;
    },
    ownerField: "id",
  }),
  catchAsync(async (req, res) => {
    const { firstName, lastName, email } = req.body;
    const user = req.resource;
    const result = await req.db.query("UPDATE users SET ? WHERE id = ?", [
      { first_name: firstName, last_name: lastName, email },
      user.id,
    ]);

    if (result.affectedRows === 0) {
      return res.sendError("User does not exist", "User Not Found", 404, ERROR_CODES.USER_NOT_FOUND);
    }

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
  }),
  catchAsync(async (req, res) => {
    const { userUUID } = req.params;
    const result = await req.db.query("DELETE FROM users WHERE user_uuid = ?", [userUUID]);
    if (result.affectedRows === 0) {
      return res.sendError("User does not exist.", "User Not Found", 404, ERROR_CODES.USER_NOT_FOUND);
    }

    res.sendSuccess("User deleted successfully", null, 200);
  }),
);

export default router;
