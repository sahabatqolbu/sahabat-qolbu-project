// backend/src/db/index.js
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import dotenv from "dotenv";
import * as schema from "./schema.js";
import * as relations from "./relations.js";
import { logger } from "../utils/logger.js";

dotenv.config();

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// Create MySQL Connection Pool (Optimized for Shared Hosting)
const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parsePositiveInt(process.env.DB_POOL_MAX, 5), // Low default for shared hosting
  maxIdle: parsePositiveInt(process.env.DB_POOL_MAX, 5),
  idleTimeout: parsePositiveInt(process.env.DB_POOL_IDLE_TIMEOUT, 30000),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const ensureSchemaCompatibility = async () => {
  if (process.env.ENABLE_RUNTIME_SCHEMA_PATCH !== "true") {
    logger.info("Runtime schema compatibility patch disabled");
    return;
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PROD_RUNTIME_SCHEMA_PATCH !== "true"
  ) {
    throw new Error(
      "Runtime schema patch is emergency-only and disabled in production. Use reviewed migrations, or set ALLOW_PROD_RUNTIME_SCHEMA_PATCH=true for a documented emergency."
    );
  }

  logger.warn("Runtime schema compatibility patch enabled; use only as an emergency fallback");

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
      logger.info("Added missing users.created_by compatibility column");
    }

    const [notifTypeRows] = await poolConnection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'type'`,
      [process.env.DB_NAME]
    );

    const hasNotificationsType = Number(notifTypeRows?.[0]?.total || 0) > 0;

    if (hasNotificationsType) {
      const [enumRows] = await poolConnection.query(
        `SELECT COLUMN_TYPE AS colType
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'type'`,
        [process.env.DB_NAME]
      );

      const colType = String(enumRows?.[0]?.colType || "");
      const hasKtpReupload = colType.includes("'AGENT_KTP_REUPLOAD'");
      const hasAgentDocsRequest = colType.includes("'AGENT_DOCS_REQUEST'");
      if (!hasKtpReupload || !hasAgentDocsRequest) {
        await poolConnection.query(
          "ALTER TABLE notifications MODIFY COLUMN type ENUM(\"AGENT_REGISTERED\",\"AGENT_SUBMITTED\",\"AGENT_APPROVED\",\"AGENT_REJECTED\",\"JAMAAH_REGISTERED\",\"JAMAAH_SUBMITTED\",\"JAMAAH_APPROVED\",\"PAYMENT_CREATED\",\"PAYMENT_VERIFIED\",\"BOOKING_CREATED\",\"SYSTEM\",\"REMINDER_DOCUMENT\",\"REMINDER_PAYMENT\",\"REMINDER_PROFILE\",\"REMINDER_GENERAL\",\"AGENT_KTP_REUPLOAD\",\"AGENT_DOCS_REQUEST\") NOT NULL"
        );
        logger.info(
          "Updated notifications.type enum (AGENT_KTP_REUPLOAD/AGENT_DOCS_REQUEST)"
        );
      }
    }

    const [agentDataCols] = await poolConnection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'agent_data' AND COLUMN_NAME = 'id_card_design_file'`,
      [process.env.DB_NAME]
    );

    const hasIdCardDesign = Number(agentDataCols?.[0]?.total || 0) > 0;
    if (!hasIdCardDesign) {
      await poolConnection.query(
        "ALTER TABLE agent_data ADD COLUMN id_card_design_file VARCHAR(500) NULL"
      );
      logger.info("Added missing agent_data.id_card_design_file column");
    }

    const [profilePhotoCols] = await poolConnection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'agent_data' AND COLUMN_NAME = 'profile_photo'`,
      [process.env.DB_NAME]
    );

    const hasProfilePhoto = Number(profilePhotoCols?.[0]?.total || 0) > 0;
    if (!hasProfilePhoto) {
      await poolConnection.query(
        "ALTER TABLE agent_data ADD COLUMN profile_photo VARCHAR(500) NULL"
      );
      logger.info("Added missing agent_data.profile_photo column");
    }

    const [proofStatusCols] = await poolConnection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jamaah_payments' AND COLUMN_NAME = 'proof_status'`,
      [process.env.DB_NAME]
    );

    const hasProofStatus = Number(proofStatusCols?.[0]?.total || 0) > 0;
    if (!hasProofStatus) {
      await poolConnection.query(
        "ALTER TABLE jamaah_payments ADD COLUMN proof_status ENUM('UPLOADED','VERIFIED','REJECTED') NOT NULL DEFAULT 'UPLOADED'"
      );
      await poolConnection.query(
        "CREATE INDEX jp_proof_status_idx ON jamaah_payments (proof_status)"
      );
      logger.info("Added missing jamaah_payments.proof_status column");
    }

    const [rejectedByCols] = await poolConnection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jamaah_payments' AND COLUMN_NAME = 'rejected_by'`,
      [process.env.DB_NAME]
    );

    const hasRejectedBy = Number(rejectedByCols?.[0]?.total || 0) > 0;
    if (!hasRejectedBy) {
      await poolConnection.query(
        "ALTER TABLE jamaah_payments ADD COLUMN rejected_by INT NULL"
      );
      logger.info("Added missing jamaah_payments.rejected_by column");
    }

    const [rejectedAtCols] = await poolConnection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jamaah_payments' AND COLUMN_NAME = 'rejected_at'`,
      [process.env.DB_NAME]
    );

    const hasRejectedAt = Number(rejectedAtCols?.[0]?.total || 0) > 0;
    if (!hasRejectedAt) {
      await poolConnection.query(
        "ALTER TABLE jamaah_payments ADD COLUMN rejected_at DATETIME NULL"
      );
      logger.info("Added missing jamaah_payments.rejected_at column");
    }

    const [rejectionReasonCols] = await poolConnection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'jamaah_payments' AND COLUMN_NAME = 'rejection_reason'`,
      [process.env.DB_NAME]
    );

    const hasRejectionReason = Number(rejectionReasonCols?.[0]?.total || 0) > 0;
    if (!hasRejectionReason) {
      await poolConnection.query(
        "ALTER TABLE jamaah_payments ADD COLUMN rejection_reason TEXT NULL"
      );
      logger.info("Added missing jamaah_payments.rejection_reason column");
    }
  } catch (error) {
    logger.error("Schema compatibility check failed", error);
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
    logger.info("Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    logger.error("Database connection failed", error);
    return false;
  }
};

export default db;
