export async function addUserRole(userId, db, roleId = 3) {
  const [result] = await db.query(
    `
    INSERT INTO user_roles (user_id, role_id)
    VALUES (?,?)`,
    [userId, roleId],
  );
  return result;
}

export async function findUserRole(id, db) {
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

