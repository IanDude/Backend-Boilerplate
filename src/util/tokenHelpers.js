import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import jwt from "jsonwebtoken";

const privateKey = fs.readFileSync(path.resolve(`${process.env.JWT_PRIVATE_PATH}`), "utf-8");

export const generateToken = (payload, exp = "24h") => {
  const token = jwt.sign(payload, privateKey, {
    expiresIn: process.env.JWT_EXPIRES_IN || exp,
    algorithm: "RS256",
  });
  return token;
};

export const generatePasswordToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return rawToken;
};

export const hashPasswordToken = (rawToken) => {
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return hashedToken;
};
