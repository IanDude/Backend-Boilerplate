import APIError, { ERROR_CODES } from "../util/APIError.js";

export async function savePasswordToken(user_uuid, hashedToken, db) {
  const [result] = await db.query(
    `
    INSERT INTO password_tokens (user_uuid, token_hash, expires_at)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
    `,
    [user_uuid, hashedToken],
  );

  return result;
}

export async function findValidToken(hashedToken, db) {
  const [passwordToken] = await db.query(
    `
    SELECT * FROM password_tokens WHERE token_hash = ? 
    AND expires_at > NOW()
    AND used_at IS NULL 
    `,
    [hashedToken],
  );

  return passwordToken[0] || null;
}

export async function invalidateAllPasswordToken(user_uuid, db) {
  const [result] = await db.query(
    `UPDATE password_tokens SET used_at = NOW()
     WHERE user_uuid = ? AND used_at IS NULL`,
    [user_uuid],
  );

  return result;
}
