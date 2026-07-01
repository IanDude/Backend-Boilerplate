import generateUUID from "../util/generateUUID.js";

export async function getAll(db) {
  const [result] = await db.query("SELECT role_uuid, name FROM roles");
  // console.log(result);
  return result || null;
}

export async function findByUUID(roleUUID, db) {
  const [role] = await db.query(
    `
    SELECT role_uuid, name FROM roles
    WHERE role_uuid = ?
    `,
    [roleUUID],
  );

  return role;
}

export async function createNewRole(roleName, db) {
  const [result] = await db.query(
    `
    INSERT INTO roles (role_uuid, name) VALUES (?, ?)
    `,
    [generateUUID(), roleName],
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
