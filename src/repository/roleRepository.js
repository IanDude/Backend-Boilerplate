import APIError, { ERROR_CODES } from "../util/APIError.js";
import generateUUID from "../util/generateUUID.js";

export async function getAll(db) {
  const [result] = await db.query("SELECT role_uuid, name FROM roles");
  if (result.length === 0) return null;
  return result;
}

export async function findByUUID(roleUUID, db) {
  const [role] = await db.query(
    `
    SELECT * FROM roles
    WHERE role_uuid = ?
    `,
    [roleUUID],
  );
  if (role.length === 0) return null;
  return role[0];
}

export async function createNewRole(roleData, db) {
  const [result] = await db.query(
    `
    INSERT INTO roles SET ?
    `,
    [roleData],
  );
  return result;
}

export async function updateByUUID(roleUUID, roleName, db) {
  const [result] = await db.query(
    `
    UPDATE roles SET name = ?
    WHERE role_uuid = ?
    `,
    [roleName, roleUUID],
  );
  return result;
}

export async function deleteByUUID(roleUUID, db) {
  const [result] = await db.query(
    `
    DELETE FROM roles
    WHERE role_uuid = ?
    `,
    [roleUUID],
  );
  return result;
}
