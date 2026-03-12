import { Router } from "express";
import { catchAsync } from "../../util/catchAsync.js";
import { validateBody, validateParams } from "../../util/validation.js";
import { methodByIdSchema, newUserSchema } from "../../schemas/user.schema.js";
import { hashPassword } from "../../util/passwordHelpers.js";

const router = Router();

//GET /users/ or /users - Get all users
router.get(
  "/",
  catchAsync(async (req, res) => {
    const users = await req.db.query("SELECT id, name, email, status, created_at FROM users");
    // console.log(users);
    res.sendSuccess("Success", users, 200);
    // res.status(200).json({ message: "Should be all users" });
  }),
);

//GET /users/:id - Get a user by ID
router.get(
  "/:id",
  validateParams(methodByIdSchema),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await req.db.query("SELECT id, name, email, status, created_at FROM users WHERE id = ?", [id]);

    if (user.length === 0) {
      return res.sendError("No User found", "User Not Found", 404, "USER_NOT_FOUND");
    }

    res.sendSuccess("User Found", user, 200);
  }),
);

//POST /users or /users/ - Create a new user
router.post(
  "/",
  validateBody(newUserSchema),
  catchAsync(async (req, res) => {
    const { name, email, status, password } = req.body;
    const [userExist] = await req.db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (userExist && (userExist.length > 0 || userExist.id)) {
      return res.sendError("Email is already taken, use a different one", "Duplicate Email", 409, "DUPLICATE_ENTRY");
    }
    const { hashedPassword, salt } = await hashPassword(password);
    const newUser = {
      name,
      email,
      password: hashedPassword,
      status: status || "active",
      salt: salt,
    };
    const result = await req.db.query("INSERT INTO users SET ?", [newUser]);
    if (result.affectedRows === 0) {
      return res.sendError("Failed to create user", 400);
    }

    res.sendSuccess("User created successfully", { id: result.insertId, name, email, status: newUser.status }, 201);
  }),
);

//POST /users/register - Create new user with transaction
router.post(
  "/register",
  validateBody(newUserSchema),
  catchAsync(async (req, res) => {
    const connection = await req.db.beginTransaction();
    try {
      const { name, email, password } = req.body;
      const [userExist] = await connection.query("SELECT id FROM users WHERE email = ?", [email]);
      if (userExist && (userExist.length > 0 || userExist.id)) {
        return res.sendError("Email is already taken, use a different one", "Duplicate Email", 409, "DUPLICATE_ENTRY");
      }
      const { hashedPassword, salt } = await hashPassword(password);
      const newUser = {
        name,
        email,
        password: hashedPassword,
        status: "pending",
        salt: salt,
      };
      const [insertResult] = await connection.query("INSERT INTO users SET ?", [newUser]);
      console.log(insertResult);
      if (insertResult.affectedRows === 0) {
        return res.sendError("Failed to create new user", "Register Error", 400, "");
      }
      const newUserId = insertResult.insertId;
      const verifiedUser = connection.query("UPDATE users SET status = 'verified' WHERE id = ? ", [newUserId]);
      if (verifiedUser && (verifiedUser.length > 0 || verifiedUser.affectedRows === 0)) {
        return res.sendError("Failed to verify user", "Verification Failed", 500, "INTERNAL_ERROR");
      }
      await req.db.commit(connection);

      res.sendSuccess(
        "User created and verified successfully",
        { id: newUserId, name, email, status: "verified" },
        201,
      );
    } catch (error) {
      await req.db.rollback(connection);
      next(error);
    }
  }),
);

//PUT /users/:id - Update user by ID

router.put(
  "/:id",
  validateParams(methodByIdSchema),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, email, status } = req.body;

    const result = await req.db.query("UPDATE users SET ? WHERE id = ?", [{ name, email, status }, id]);

    if (result.affectedRows === 0) {
      return res.sendError("User does not exist", "User Not Found", 404, "USER_NOT_FOUND");
    }

    res.sendSuccess("User updated successfully", null, 200);
  }),
);

//DELETE /users/:id

router.delete(
  "/:id",
  validateParams(methodByIdSchema),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await req.db.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.sendError("User does not exist.", "User Not Found", 404, "USER_NOT_FOUND");
    }

    res.sendSuccess("User deleted successfully", null, 200);
  }),
);

export default router;
