export async function getAll(db) {
  const [result] = await db.query("SELECT name FROM roles");

  return result;
}
