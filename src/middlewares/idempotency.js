import moment from "moment-timezone";
import APIError, { ERROR_CODES } from "../util/APIError.js";

export const idempotencyMiddleware = (options = {}) => {
  const { ttlHours = 24 } = options;

  return async (req, res, next) => {
    try {
      const idempotencyKey = req.headers["idempotency-key"] || req.headers["Idempotency-Key"];
      if (!idempotencyKey) {
        throw new APIError("Idempotency-Key header is required", 400, ERROR_CODES.INVALID_INPUT);
      }

      const crypto = await import("node:crypto");
      const requestHash = crypto.createHash("sha256").update(JSON.stringify(req.body)).digest("hex");

      const existing = await req.db.query(
        `SELECT idempotency_key, request_hash, response_code, response_body, expires_at FROM idempotency_keys WHERE idempotency_key = ? LIMIT 1`,
        [idempotencyKey],
      );

      if (existing.length > 0) {
        const record = existing[0];

        if (new Date(record.expires_at) < new Date()) {
          await req.db.query("DELETE FROM idempotency_keys WHERE idempotency_key = ?", [idempotencyKey]);
          console.log("Expired idempotency key deleted");
        } else {
          if (record.request_hash !== requestHash) {
            throw new APIError(
              "Idempotency key already used with different request body",
              409,
              ERROR_CODES.DUPLICATE_ENTRY,
            );
          }

          req.logger.info("Idempotent request detected - returning cached response", {
            idempotencyKey,
            requestHash: requestHash.substring(0, 8),
          });
          // console.log(record.response_body);
          // const parsedBody = JSON.parse(record.response_body);
          const { message, data } = record.response_body; //destructured cached response for identical format
          return res.sendSuccess(message, data);
          // return res.status(record.response_code).json(record.response_body);
        }
      }

      const originalJson = res.json.bind(res);
      res.json = async function (data) {
        const responseCode = res.statusCode || 200;

        if (responseCode >= 200 && responseCode < 300) {
          try {
            const now = moment().tz("UTC").format("YYYY-MM-DD HH:mm:ss");
            const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");

            await req.db.query(
              `INSERT INTO idempotency_keys (
              idempotency_key,
              request_hash,
              response_code,
              response_body,
              created_at,
              expires_at
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              // {
              //   idempotency_key: idempotencyKey,
              //   request_hash: requestHash,
              //   response_code: responseCode,
              //   response_body: JSON.stringify(data),
              //   created_at: now,
              //   expires_at: expiresAt,
              // },
              [idempotencyKey, requestHash, responseCode, JSON.stringify(data), now, expiresAt],
            );
            console.log("Idempotency key stored successfully");
          } catch (error) {
            console.log("Failed to store idempotency key: ", error);
          }
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      return res.sendError("Error in Idempotency", error.stack);
      next(error);
    }
  };
};

export const cleanupExpiredKeys = async (db) => {
  try {
    const result = await db.query("DELETE FROM idempotency_keys WHERE expires_at < NOW()");
    const deletedCount = result.affectedRows || 0;

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired idempotency keys`);
    }
    return deletedCount;
  } catch (error) {
    console.error("Failed to cleanup expired idempotency keys:", error);
    throw error;
  }
};
