export async function getPermissions(userId, db) {
  const [rows] = await db.query(
    `
    SELECT DISTINCT p.name from user_roles ur
    INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ?
    `,
    [userId],
  );
  return rows || null;
}
