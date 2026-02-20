import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../../");
const uploadDir = path.resolve(projectRoot, "public/uploads");

const run = async () => {
  await fs.access(uploadDir);

  const metadataPath = path.join(uploadDir, "backup-metadata.json");
  await fs.access(metadataPath);

  const metadataRaw = await fs.readFile(metadataPath, "utf8");
  const metadata = JSON.parse(metadataRaw);

  const requiredFields = [
    "createdAt",
    "sourceDir",
    "backupDir",
    "fileCount",
    "totalBytes",
  ];

  for (const field of requiredFields) {
    if (!(field in metadata)) {
      throw new Error(`Missing backup metadata field: ${field}`);
    }
  }

  const hasValidCounts =
    Number.isInteger(Number(metadata.fileCount)) && Number(metadata.fileCount) >= 0;
  const hasValidSize = Number.isFinite(Number(metadata.totalBytes)) && Number(metadata.totalBytes) >= 0;

  if (!hasValidCounts || !hasValidSize) {
    throw new Error("Invalid file count or total bytes in backup metadata");
  }

  console.log("Restore smoke check passed");
  console.log(
    JSON.stringify({
      checkedPath: uploadDir,
      metadataPath,
      fileCount: Number(metadata.fileCount),
      totalBytes: Number(metadata.totalBytes),
    })
  );
};

run().catch((error) => {
  console.error("Restore smoke check failed");
  console.error(error?.message || String(error));
  process.exit(1);
});
