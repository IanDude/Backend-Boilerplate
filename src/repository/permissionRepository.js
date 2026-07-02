export async function getUserPermissionsById(userId, db) {
  const [result] = await db.query(
    `
    SELECT DISTINCT p.name from user_roles ur
    INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ?
    `,
    [userId],
  );
  if (result.length === 0) return null;
  return result;
}

export async function getAll(db) {
  const [result] = await db.query(
    `
    SELECT permission_uuid, name
    FROM permissions
    `,
  );
  if (result.length === 0) return null;
  return result;
}

export async function createNewPermission(permissionData, db) {
  const [result] = await db.query(
    `
    INSERT INTO permissions SET ?
    `,
    [permissionData],
  );
  return result;
}

export async function updateByUUID(permissionUUID, permissionName, db) {
  const [result] = await db.query(
    `
    UPDATE permissions SET name = ?
    WHERE permission_uuid = ?
    `,
    [permissionName, permissionUUID],
  );
  return result;
}

export async function deleteByUUID(permissionUUID, db) {
  const [result] = await db.query(
    `
    DELETE FROM permissions
    WHERE permission_uuid = ?
    `,
    [permissionUUID],
  );
  return result;
}
