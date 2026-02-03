// backend/src/db/index.js
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

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
