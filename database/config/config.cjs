require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

console.log("DB CONFIG:", {
  user: process.env.DB_USER,
  pass: process.env.DB_PASS,
  db: process.env.DB_DATABASE_DEV,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
});

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE_DEV,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    charset: "utf8mb4",
    collate: "utf8mb4_general_ci",
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "database_test",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    charset: "utf8mb4",
    collate: "utf8mb4_general_ci",
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "database_production",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    charset: "utf8mb4",
    collate: "utf8mb4_general_ci",
  },
};
