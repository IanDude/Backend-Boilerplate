import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";

const privateKey = fs.readFileSync(path.resolve(`${process.env.JWT_PRIVATE_PATH}`), "utf-8");

export const generateToken = (payload) => {
  const token = jwt.sign({ userId: payload }, privateKey, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    algorithm: "RS256",
  });
  return token;
};
