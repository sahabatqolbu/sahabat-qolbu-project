// backend/src/db/index.js
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import dotenv from "dotenv";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

dotenv.config();

// Create MySQL Connection Pool (Optimized for Shared Hosting)
const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5, // Low limit untuk shared hosting
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const ensureSchemaCompatibility = async () => {
  try {
    const [rows] = await poolConnection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'created_by'`,
      [process.env.DB_NAME]
    );

    const hasCreatedBy = Number(rows?.[0]?.total || 0) > 0;

    if (!hasCreatedBy) {
      await poolConnection.query("ALTER TABLE users ADD COLUMN created_by INT NULL");
      await poolConnection.query(
        "CREATE INDEX created_by_idx ON users (created_by)"
      );
      console.log("✅ Added missing users.created_by compatibility column");
    }
  } catch (error) {
    console.error("❌ Schema compatibility check failed:", error.message);
    throw error;
  }
};

// Initialize Drizzle ORM
export const db = drizzle(poolConnection, {
  schema: { ...schema, ...relations },
  mode: "default",
});

// Test Connection
export const testConnection = async () => {
  try {
    const connection = await poolConnection.getConnection();
    console.log("✅ Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
};

export default db;
