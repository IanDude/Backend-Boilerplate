export async function findById(id, db) {
  const [rows] = await db.query(
    `
    SELECT r.name FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ?
    `,
    [id],
  );
  const roles = rows.map((role) => role.name);
  return roles;
}
