import * as userRepository from "../repository/userRepository.js";
import * as userRoleRepository from "../repository/userRoleRepository.js";
import APIError, { ERROR_CODES } from "../util/APIError.js";
import { comparePassword, hashPassword } from "../util/passwordHelpers.js";
import { generatePasswordToken, generateToken, hashPasswordToken } from "../util/tokenHelpers.js";
import generateUUID from "../util/generateUUID.js";
import * as passwordRepository from "../repository/passwordRepository.js";
import * as emailService from "./emailService.js";

export async function login({ email, password }, db) {
  const user = await userRepository.findByEmail(email, db);

  if (!user) {
    // throw { message: "Account not found", status: 404, code: ERROR_CODES.USER_NOT_FOUND };
    throw new APIError("Account not found", 404, ERROR_CODES.USER_NOT_FOUND);
  }

  const isValid = await comparePassword(password, user.password, user.salt);

  if (!isValid) {
    throw new APIError("Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
  }

  const roles = await userRoleRepository.findUserRole(user.id, db);

  const token = generateToken({ user_uuid: user.user_uuid, roles });

  return { user: { user_uuid: user.user_uuid, email: user.email, status: user.status }, token };
}

export async function register({ firstName, lastName, email, password }, db) {
  const isExisting = await userRepository.findByEmail(email, db);

  if (isExisting) {
    throw new APIError("Email is taken, use a diffferent one", 409, ERROR_CODES.DUPLICATE_ENTRY);
  }

  const { hashedPassword, salt } = await hashPassword(password);

  const userData = {
    user_uuid: generateUUID(),
    first_name: firstName,
    last_name: lastName,
    email,
    password: hashedPassword,
    salt,
    status: "active",
  };

  const createNewUser = await userRepository.createNewUser(userData, db);
  if (createNewUser.affectedRows === 0) {
    throw new APIError("Failed to create new user", 500, ERROR_CODES.DATABASE_ERROR);
  }

  const addUserRole = await userRoleRepository.addUserRole(createNewUser.insertId, db);
  if (addUserRole.affectedRows === 0) throw new APIError("Failed to add user role", 400, ERROR_CODES.DATABASE_ERROR);

  return { user_uuid: userData.user_uuid, email, status: userData.status };
}

export async function resetPassword({ token, newPassword }, db) {
  const hashedToken = hashPasswordToken(token);

  const passwordToken = await passwordRepository.findValidToken(hashedToken, db);

  if (!passwordToken) {
    throw new APIError("Invalid or expired token", 400, ERROR_CODES.INVALID_ORIGIN);
  }

  const user_uuid = passwordToken.user_uuid;
  const { hashedPassword } = await hashPassword(newPassword);

  const updatePassword = await userRepository.updateUserPassword({ user_uuid, hashedPassword }, db);

  if (updatePassword.affectedRows === 0) {
    throw new APIError("Failed to update password", 500, ERROR_CODES.DATABASE_ERROR);
  }

  const invalidateAllPasswordToken = await passwordRepository.invalidateAllPasswordToken(user_uuid, db);

  if (invalidateAllPasswordToken.affectedRows === 0) {
    throw new APIError("Failed to invalidate password token", 400, ERROR_CODES.DATABASE_ERROR);
  }
}

export async function forgotPassword({ email }, db) {
  const user = await userRepository.findByEmail(email, db);

  if (!user) {
    throw new APIError("If this email exists, a reset link has been sent", 400, ERROR_CODES.INVALID_INPUT);
  }

  const rawToken = generatePasswordToken();
  const hashedToken = hashPasswordToken(rawToken);

  const insertToken = await passwordRepository.savePasswordToken(user.user_uuid, hashedToken, db);

  if (insertToken.affectedRows === 0) {
    throw new APIError("Failed to save password token");
  }

  const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${rawToken}`;

  try {
    await emailService.sendPasswordResetEmail(email, resetLink);
  } catch (error) {
    throw new APIError("Failed to send email", 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
