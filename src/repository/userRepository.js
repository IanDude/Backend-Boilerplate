import APIError, { ERROR_CODES } from "../util/APIError.js";

export async function findByEmail(email, db) {
  const [result] = await db.query(
    `
    SELECT id, user_uuid, email, password, salt, status
    FROM users WHERE email = ?`,
    [email],
  );
  if (result.length === 0) return null;
  return result[0];
}

export async function createNewUser(newUserData, db) {
  const [result] = await db.query(
    `
    INSERT INTO users SET ?
    `,
    newUserData,
  );
  return result;
}

export async function updateUserPassword({ user_uuid, hashedPassword }, db) {
  const [result] = await db.query(
    `
    UPDATE users SET password = ?
    WHERE user_uuid = ?`,
    [hashedPassword, user_uuid],
  );

  return result;
}

export async function getAll(db) {
  const [users] = await db.query(
    `SELECT id, user_uuid, first_name, last_name, email, status, created_at, updated_at
    FROM users`,
  );
  if (users.length === 0) return null;
  return users;
}

export async function findByUUID(uuid, db) {
  const [user] = await db.query(
    `
    SELECT id, user_uuid, first_name, last_name, email, status, created_at, updated_at
    FROM users WHERE user_uuid = ?`,
    [uuid],
  );
  if (user.length === 0) return null;
  return user[0];
}

export async function verifyUserById(userId, db) {
  const [result] = await db.query(
    `
    UPDATE users SET status = 'verified' WHERE id = ?
    `,
    [userId],
  );
  return result;
}

export async function updateUser(user_uuid, { firstName, lastName, email }, db) {
  const [result] = await db.query(
    `
    UPDATE users SET ? WHERE user_uuid = ?
    `,
    [{ first_name: firstName, last_name: lastName, email }, user_uuid],
  );
  return result;
}

export async function deleteUser(user_uuid, db) {
  const [result] = await db.query(
    `
    DELETE FROM users WHERE user_uuid = ?
    `,
    [user_uuid],
  );

  return result;
}
