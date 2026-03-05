import mysql from "mysql2/promise";
class Database {
  constructor() {
    this.pool = null;
  }

  async initialize() {
    try {
      const poolConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE_DEV,
        port: parseInt(process.env.DB_PORT || 3306),
        charset: "utf8mb4",
        multipleStatements: false,
        connectionLimit: parseInt(process.env.DB_POOL_SIZE || 10),
        waitForConnection: true,
        queueLimit: parseInt(process.env.NODE_ENV === "development" ? 50 : 500),
        maxIdle: parseInt(process.env.DB_MAX_IDLE || 10),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || "60000"),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || "10000"),

        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,

        decimalNumbers: true,
        dateStrings: false,
      };

      this.pool = mysql.createPool(poolConfig);
      return this.pool;
    } catch (error) {
      throw error;
    }
  }

  async query(sql, params = [], timeout = 30000) {
    try {
      const queryPromise = this.pool.query(sql, params);
      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("Query timeout exceeded"));
        }, timeout);
      });
      const [rows] = await Promise.race([queryPromise, timeoutPromise]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  async beginTransaction() {
    try {
      const conn = await this.pool.getConnection();
      await conn.beginTransaction();
      return conn;
    } catch (error) {
      throw error;
    }
  }

  async commit(conn) {
    try {
      await conn.commit();
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }

  async rollback(conn) {
    try {
      await conn.rollback();
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }

  async close() {
    if (!this.pool) {
      return;
    }
    try {
      const stats = this.getPoolStats();
      await this.pool.end();
    } catch (error) {
      throw error;
    }
  }
}

export default Database;
