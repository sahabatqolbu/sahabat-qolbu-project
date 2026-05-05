import dotenv from "dotenv";

dotenv.config();

const required = [
  "NODE_ENV",
  "JWT_SECRET",
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "FRONTEND_URL",
  "DASHBOARD_URL",
  "BACKEND_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "COOKIE_SECURE",
  "COOKIE_DOMAIN",
  "TRUST_PROXY",
];

const failures = [];
const warnings = [];

const value = (name) => String(process.env[name] || "").trim();

const isHttpsUrl = (name) => {
  const raw = value(name);
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

for (const name of required) {
  if (!value(name)) {
    failures.push(`${name} is required for production`);
  }
}

if (value("NODE_ENV") && value("NODE_ENV") !== "production") {
  failures.push("NODE_ENV must be production");
}

if (value("JWT_SECRET") && value("JWT_SECRET").length < 32) {
  failures.push("JWT_SECRET must be at least 32 characters long");
}

for (const name of ["FRONTEND_URL", "DASHBOARD_URL", "BACKEND_URL"]) {
  if (value(name) && !isHttpsUrl(name)) {
    failures.push(`${name} must be an https URL in production`);
  }
}

if (value("COOKIE_SECURE") !== "true") {
  failures.push("COOKIE_SECURE must be true in production");
}

if (value("COOKIE_DOMAIN") !== ".sahabatqolbu.com") {
  failures.push("COOKIE_DOMAIN must be .sahabatqolbu.com in production");
}

if (value("TRUST_PROXY") === "false") {
  failures.push("TRUST_PROXY must not be false in production behind cPanel/nginx");
}

if (value("ENABLE_RUNTIME_SCHEMA_PATCH") === "true") {
  failures.push("ENABLE_RUNTIME_SCHEMA_PATCH must be unset or false in production");
}

if (value("DISABLE_RATE_LIMIT") === "true") {
  failures.push("DISABLE_RATE_LIMIT must not be true in production");
}

const corsOrigins = value("CORS_ORIGINS")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

for (const origin of corsOrigins) {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:") {
      failures.push(`CORS_ORIGINS contains non-https origin: ${origin}`);
    }
  } catch {
    failures.push(`CORS_ORIGINS contains invalid URL: ${origin}`);
  }
}

if (value("ERROR_TRACKING_ENABLED") !== "true") {
  warnings.push("ERROR_TRACKING_ENABLED is not true; production will use log-only error tracking");
}

if (!value("SMOKE_BASE_URL")) {
  warnings.push("SMOKE_BASE_URL is not set; npm run smoke will default to localhost");
}

if (failures.length > 0) {
  console.error("Production environment check failed");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  if (warnings.length > 0) {
    console.error("\nWarnings:");
    for (const warning of warnings) {
      console.error(`- ${warning}`);
    }
  }
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn("Production environment check passed with warnings");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
} else {
  console.log("Production environment check passed");
}
