import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../../");
const backupRoot = process.env.BACKUP_OUTPUT_DIR
  ? path.resolve(projectRoot, process.env.BACKUP_OUTPUT_DIR)
  : path.resolve(projectRoot, "backups/uploads");
const restoreTarget = path.resolve(projectRoot, "public/uploads");

const targetBackup = process.env.BACKUP_NAME || "latest";

const resolveLatestBackup = async () => {
  const entries = await fs.readdir(backupRoot, { withFileTypes: true });
  const candidates = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("uploads-")) {
      continue;
    }
    const abs = path.join(backupRoot, entry.name);
    const stat = await fs.stat(abs);
    candidates.push({ name: entry.name, mtimeMs: stat.mtimeMs });
  }

  if (candidates.length === 0) {
    throw new Error("No upload backup directory found");
  }

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0].name;
};

const run = async () => {
  await fs.access(backupRoot);

  const backupName = targetBackup === "latest" ? await resolveLatestBackup() : targetBackup;
  const backupDir = path.join(backupRoot, backupName);

  await fs.access(backupDir);

  await fs.mkdir(path.dirname(restoreTarget), { recursive: true });
  await fs.rm(restoreTarget, { recursive: true, force: true });
  await fs.cp(backupDir, restoreTarget, { recursive: true, force: true });

  const metadataPath = path.join(restoreTarget, "backup-metadata.json");
  try {
    await fs.access(metadataPath);
  } catch {
    // noop: metadata optional for old backups
  }

  console.log("Uploads restore completed successfully");
  console.log(JSON.stringify({ backupName, source: backupDir, target: restoreTarget }));
};

run().catch((error) => {
  console.error("Uploads restore failed");
  console.error(error?.message || String(error));
  process.exit(1);
});
