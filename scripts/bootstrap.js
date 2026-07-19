import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const REQUIRED_ENV = [
  "DB_HOST",
  "DB_USER",
  "DB_PASS",
  "DB_NAME",
  "JWT_PRIVATE_PATH",
  "JWT_PUBLIC_PATH",
  "FRONTEND_URL",
  "CSRF_SECRET",
];

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.log(`Missing required environment variables ${missing.join(", ")}`);
    process.exit(1);
  }
}

async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`Database "${process.env.DB_NAME}" ready`);
  } catch (error) {
    console.error(`Failed to create database "${process.env.DB_NAME}":`, error.message);
    throw error; // propagate so bootstrap() fails loudly and stops the npm chain
  } finally {
    await connection.end();
  }
}

function ensureKeyPair() {
  const privatePath = path.resolve(process.env.JWT_PRIVATE_PATH);
  const publicPath = path.resolve(process.env.JWT_PUBLIC_PATH);
  const keyDir = path.dirname(privatePath);

  if (fs.existsSync(privatePath) && fs.existsSync(publicPath)) {
    console.log("Key pair already exists");
    return;
  }

  fs.mkdirSync(keyDir, { recursive: true });

  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  fs.writeFileSync(privatePath, privateKey, { mode: 0o600 });
  fs.writeFileSync(publicPath, publicKey, { mode: 0o644 });
  console.log(`Generated new RSA key pair at ${keyDir}`);
}

async function bootstrap() {
  assertEnv();
  await ensureDatabase();
  ensureKeyPair();
}

bootstrap().catch((error) => {
  console.error("Bootstrap failed: ", error);
  process.exit(1);
});
