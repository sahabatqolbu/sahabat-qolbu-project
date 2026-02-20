import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../../");
const sourceDir = path.resolve(projectRoot, "public/uploads");
const outputRoot = process.env.BACKUP_OUTPUT_DIR
  ? path.resolve(projectRoot, process.env.BACKUP_OUTPUT_DIR)
  : path.resolve(projectRoot, "backups/uploads");

const retentionDays = Number.parseInt(process.env.BACKUP_RETENTION_DAYS || "14", 10);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupName = `uploads-${timestamp}`;
const backupDir = path.join(outputRoot, backupName);

const countFilesAndBytes = async (dirPath) => {
  let fileCount = 0;
  let totalBytes = 0;

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const child = await countFilesAndBytes(abs);
      fileCount += child.fileCount;
      totalBytes += child.totalBytes;
    } else if (entry.isFile()) {
      const stat = await fs.stat(abs);
      fileCount += 1;
      totalBytes += stat.size;
    }
  }

  return { fileCount, totalBytes };
};

const cleanupOldBackups = async () => {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    return [];
  }

  const threshold = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const removed = [];

  let entries = [];
  try {
    entries = await fs.readdir(outputRoot, { withFileTypes: true });
  } catch {
    return removed;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("uploads-")) {
      continue;
    }

    const abs = path.join(outputRoot, entry.name);
    const stat = await fs.stat(abs);
    if (stat.mtimeMs < threshold) {
      await fs.rm(abs, { recursive: true, force: true });
      removed.push(entry.name);
    }
  }

  return removed;
};

const run = async () => {
  await fs.access(sourceDir);
  await fs.mkdir(outputRoot, { recursive: true });

  await fs.cp(sourceDir, backupDir, { recursive: true, force: true });

  const summary = await countFilesAndBytes(backupDir);
  const metadata = {
    createdAt: new Date().toISOString(),
    sourceDir,
    backupDir,
    retentionDays,
    fileCount: summary.fileCount,
    totalBytes: summary.totalBytes,
  };

  await fs.writeFile(
    path.join(backupDir, "backup-metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf8"
  );

  await fs.writeFile(path.join(outputRoot, "latest-backup.txt"), `${backupName}\n`, "utf8");

  const removed = await cleanupOldBackups();

  console.log("Uploads backup created successfully");
  console.log(JSON.stringify({
    backup: backupName,
    backupDir,
    fileCount: summary.fileCount,
    totalBytes: summary.totalBytes,
    removedOldBackups: removed,
  }));
};

run().catch((error) => {
  console.error("Uploads backup failed");
  console.error(error?.message || String(error));
  process.exit(1);
});
