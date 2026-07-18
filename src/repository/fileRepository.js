export async function saveFileData(fileData, db) {
  const [result] = await db.query(
    `
    INSERT INTO files SET ?
    `,
    fileData,
  );
  return result;
}

export async function findByUUID(fileUUID, db) {
  const [result] = await db.query(
    `
    SELECT * FROM files WHERE file_uuid = ?
    `,
    [fileUUID],
  );
  if (result.length === 0) return null;
  return result[0];
}

export async function getAll(db) {
  const [result] = await db.query(
    `
    SELECT * FROM files
    `,
  );
  if (result.length === 0) return null;
  return result;
}

export async function getFiles(fileUUIDs, db) {
  const [result] = await db.query(
    `
    SELECT * FROM files WHERE file_uuid IN (?)
    `,
    [fileUUIDs],
  );
  return result;
}

export async function updateData(fileId, originalName, category, isPublic, db) {
  const [result] = await db.query(
    `
    UPDATE files SET ? WHERE file_id = ?
    `,
    [{ original_name: originalName, category, is_public: isPublic }, fileId],
  );
  return result;
}

export async function deleteData(fileId, db) {
  const [result] = await db.query(
    `
    DELETE FROM files WHERE file_id = ?
    `,
    [fileId],
  );
  return result;
}
