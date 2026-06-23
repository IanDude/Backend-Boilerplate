export async function addUserRole(userId, db, roleId = 3) {
  const [result] = await db.query(
    `
    INSERT INTO user_roles (user_id, role_id)
    VALUES (?,?)`,
    [userId, roleId],
  );
  return result;
}
