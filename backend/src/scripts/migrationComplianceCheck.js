import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import { execFileSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

const migrationDir = path.join(projectRoot, "backend/drizzle/migrations");
const metaDir = path.join(migrationDir, "meta");
const journalPath = path.join(metaDir, "_journal.json");
const configPath = path.join(projectRoot, "backend/drizzle.config.js");
const packagePath = path.join(projectRoot, "backend/package.json");

const migrationDirRel = "backend/drizzle/migrations";
const expectedSqlPatterns = [
  "`users` ADD `created_by`",
  "`notifications` MODIFY COLUMN `type` enum",
  "AGENT_KTP_REUPLOAD",
  "AGENT_DOCS_REQUEST",
  "`agent_data` ADD `id_card_design_file`",
  "`agent_data` ADD `profile_photo`",
  "`jamaah_payments` ADD `proof_status`",
  "`jamaah_payments` ADD `rejected_by`",
  "`jamaah_payments` ADD `rejected_at`",
  "`jamaah_payments` ADD `rejection_reason`",
];

const pathExists = async (target) => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

const isGitIgnored = (relativePath) => {
  try {
    execFileSync("git", ["check-ignore", "-q", relativePath], {
      cwd: projectRoot,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

const run = async () => {
  const failures = [];

  if (!(await pathExists(migrationDir))) {
    failures.push("Missing backend/drizzle/migrations directory");
  }

  if (!(await pathExists(metaDir))) {
    failures.push("Missing backend/drizzle/migrations/meta directory");
  }

  if (!(await pathExists(journalPath))) {
    failures.push("Missing backend/drizzle/migrations/meta/_journal.json");
  }

  if (isGitIgnored(migrationDirRel)) {
    failures.push("backend/drizzle/migrations is still ignored by git");
  }

  if (await pathExists(migrationDir)) {
    const entries = await fs.readdir(migrationDir);
    const sqlFiles = entries.filter((entry) => entry.endsWith(".sql"));
    if (sqlFiles.length === 0) {
      failures.push("No SQL migration files found in backend/drizzle/migrations");
    }

    const combinedSql = (
      await Promise.all(
        sqlFiles.map((file) => fs.readFile(path.join(migrationDir, file), "utf8"))
      )
    ).join("\n");

    for (const pattern of expectedSqlPatterns) {
      if (!combinedSql.includes(pattern)) {
        failures.push(`Migration SQL does not include expected baseline change: ${pattern}`);
      }
    }
  }

  const config = await fs.readFile(configPath, "utf8");
  if (!config.includes('out: "./drizzle/migrations"')) {
    failures.push("drizzle.config.js does not write to ./drizzle/migrations");
  }

  const packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"));
  const scripts = packageJson.scripts || {};
  if (scripts["db:push"] && scripts["db:push"].includes("drizzle-kit push")) {
    failures.push("db:push must not run drizzle-kit push directly; use db:push:dev for disposable local databases");
  }
  if (scripts["db:migrate"] !== "drizzle-kit migrate") {
    failures.push("db:migrate must run drizzle-kit migrate");
  }

  if (failures.length > 0) {
    console.error("Migration compliance check failed");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Migration compliance check passed");
};

run().catch((error) => {
  console.error("Migration compliance check failed");
  console.error(error?.message || String(error));
  process.exit(1);
});
