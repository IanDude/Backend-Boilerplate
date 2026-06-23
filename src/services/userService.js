import * as userRepository from "../repository/userRepository.js";
import * as userRoleRepository from "../repository/userRoleRepository.js";
import APIError, { ERROR_CODES } from "../util/APIError.js";
import generateUUID from "../util/generateUUID.js";
import { hashPassword } from "../util/passwordHelpers.js";

export async function getAllUsers(db) {
  const users = await userRepository.getAll(db);
  // console.log(users);
  if (!users) throw new APIError("No Data Found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
  return users;
}

export async function getUserByUUID(uuid, db) {
  const result = await userRepository.findByUUID(uuid, db);
  if (!reuslt) throw new APIError("No User Found", 404, ERROR_CODES.USER_NOT_FOUND);
  return result;
}

export async function createNewUser({ firstName, lastName, email, status, password }, db) {
  const userExists = await userRepository.findByEmail(email, db);

  if (userExists) {
    throw new APIError("Email is already taken, use a different one", 409, ERROR_CODES.DUPLICATE_ENTRY);
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

  const createNewUser = await userRepository.createNewUser(newUser, db);
  if (createNewUser.affectedRows === 0)
    throw new APIError("Failed to insert new user", 400, ERROR_CODES.DATABASE_ERROR);

  const addUserRole = await userRoleRepository.addUserRole(createNewUser.insertId, db);

  return {
    user_uuid: newUser.user_uuid,
    firstName: newUser.first_name,
    lastName: newUser.last_name,
    email: newUser.email,
    status: newUser.status,
  };
}

export async function createNewUserTransac({ firstName, lastName, email, password }, db) {
  const userExists = await userRepository.findByEmail(email, db);
  const { hashedPassword, salt } = await hashPassword(password);

  const newUser = {
    user_uuid: generateUUID(),
    first_name: firstName,
    last_name: lastName,
    email,
    password: hashedPassword,
    status: "pending",
    salt,
  };

  const insertResult = await userRepository.createNewUser(newUser, db);

  if (insertResult.affectedRows === 0) {
    throw new APIError("Failed to insert new user", 400, ERROR_CODES.DATABASE_ERROR);
  }

  const newUserId = insertResult.insertId;
  const verifiedUser = await userRepository.verifyUserById(newUserId, db);

  if (verifiedUser.affectedRows === 0)
    throw new APIError("Failed to update user status", 400, ERROR_CODES.DATABASE_ERROR);
}

export async function updateUserByUUID(user_uuid, { firstName, lastName, email }, db) {
  const result = await userRepository.updateUser(user_uuid, { firstName, lastName, email }, db);

  if (result.affectedRows === 0) throw new APIError("Failed to update user", 400, ERROR_CODES.DATABASE_ERROR);
}

export async function deleteUserByUUID(userUUID, db) {
  const result = await userRepository.deleteUser(userUUID, db);
  if (result.affectedRows === 0) throw new APIError("Failed to delete user", 400, ERROR_CODES.DATABASE_ERROR);
}
