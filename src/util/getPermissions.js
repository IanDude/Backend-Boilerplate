async function getPermissions(db, id) {
  const rows = await db.query(
    `
    SELECT DISTINCT p.name from user_roles ur
    INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ?
    `,
    [id],
  );
  return new Set(rows.map((p) => p.name));
}

export default getPermissions;
