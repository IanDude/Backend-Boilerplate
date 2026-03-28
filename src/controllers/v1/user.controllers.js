import { Router } from "express";
import { catchAsync } from "../../util/catchAsync.js";
import { validateBody, validateParams } from "../../util/validation.js";
import { UserIdParamSchema, newUserSchema, updateUserSchema } from "../../schemas/user.schema.js";
import { hashPassword } from "../../util/passwordHelpers.js";
import { idempotencyMiddleware } from "../../middlewares/idempotency.js";
import APIError, { ERROR_CODES } from "../../util/APIError.js";
import generateUUID from "../../util/generateUUID.js";

const router = Router();

//GET /users/ or /users - Get all users
router.get(
  "/",
  catchAsync(async (req, res) => {
    const users = await req.db.query(
      "SELECT id, user_uuid, first_name, last_name, email, status, created_at, updated_at FROM users",
    );
    // console.log(users);
    res.sendSuccess("Success", users, 200);
    // res.status(200).json({ message: "Should be all users" });
  }),
);

//GET /users/:id - Get a user by ID
router.get(
  "/:userId",
  validateParams(UserIdParamSchema),
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    const [user] = await req.db.query(
      "SELECT id, user_uuid, first_name, last_name, email, status, created_at, updated_at FROM users WHERE user_uuid = ?",
      [userId],
    );

    if (user.length === 0) {
      return res.sendError("No User found", "User Not Found", 404, ERROR_CODES.USER_NOT_FOUND);
    }

    res.sendSuccess("User Found", user, 200);
  }),
);

//POST /users or /users/ - Create a new user
router.post(
  "/",
  validateBody(newUserSchema),
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

      if (verifiedUser && (verifiedUser.length > 0 || verifiedUser.affectedRows === 0)) {
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
  "/:userId",
  validateParams(UserIdParamSchema),
  validateBody(updateUserSchema),
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { firstName, lastName, email } = req.body;

    const result = await req.db.query("UPDATE users SET ? WHERE user_uuid = ?", [
      { first_name: firstName, last_name: lastName, email },
      userId,
    ]);

    if (result.affectedRows === 0) {
      return res.sendError("User does not exist", "User Not Found", 404, ERROR_CODES.USER_NOT_FOUND);
    }

    res.sendSuccess("User updated successfully", null, 200);
  }),
);

//DELETE /users/:id

router.delete(
  "/:userId",
  validateParams(UserIdParamSchema),
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    const result = await req.db.query("DELETE FROM users WHERE user_uuid = ?", [userId]);
    if (result.affectedRows === 0) {
      return res.sendError("User does not exist.", "User Not Found", 404, ERROR_CODES.USER_NOT_FOUND);
    }

    res.sendSuccess("User deleted successfully", null, 200);
  }),
);

export default router;
