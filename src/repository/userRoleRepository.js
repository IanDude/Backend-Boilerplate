import APIError, { ERROR_CODES } from "../util/APIError.js";

export async function assign(userId, roleId, db) {
  const [result] = await db.query(
    `
    INSERT INTO user_roles (user_id, role_id)
    VALUES (?,?)`,
    [userId, roleId],
  );
  return result;
}

export async function remove(userId, roleId, db) {
  const [result] = await db.query(
    `
    DELETE FROM user_roles WHERE user_id = ? AND role_id = ?
    `,
    [userId, roleId],
  );
  return result;
}

export async function findUserRole(id, db) {
  const [result] = await db.query(
    `
    SELECT r.name FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ?
    `,
    [id],
  );
  if (result.length === 0) return null;
  const roles = result.map((role) => role.name);
  return roles;
}

export async function exists(userId, roleId, db) {
  const [result] = await db.query(
    `
    SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ? LIMIT 1
    `,
    [userId, roleId],
  );

  return result.length > 0;
}

export async function countUsersWithRole(roleId, db) {
  const [result] = await db.query(
    `
    SELECT COUNT(*) AS count FROM user_roles WHERE role_id = ?
    `,
    [roleId],
  );
  return result[0].count;
}