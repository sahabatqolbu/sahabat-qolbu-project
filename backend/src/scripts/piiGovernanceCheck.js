import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

const matrixPath = path.join(projectRoot, "PII_ACCESS_MATRIX.md");
const appPath = path.join(projectRoot, "backend/src/app.js");

const requiredMatrixSnippets = [
  "## 3) Access Matrix per Role",
  "## 5) Jadwal Review Quarterly",
  "/api/protected-uploads/*",
  "## 7) Evidence Review Template",
];

const requiredAppSnippets = [
  "protectedFolders",
  '"profiles"',
  '"jamaah"',
  '"agents"',
  '"documents"',
  '"payments"',
];

const run = async () => {
  const matrix = await fs.readFile(matrixPath, "utf8");
  const app = await fs.readFile(appPath, "utf8");

  const missingMatrix = requiredMatrixSnippets.filter((s) => !matrix.includes(s));
  const missingApp = requiredAppSnippets.filter((s) => !app.includes(s));

  if (missingMatrix.length > 0 || missingApp.length > 0) {
    console.error("PII governance check failed");
    for (const item of missingMatrix) {
      console.error(`- Missing PII matrix snippet: ${item}`);
    }
    for (const item of missingApp) {
      console.error(`- Missing app security snippet: ${item}`);
    }
    process.exit(1);
  }

  console.log("PII governance check passed");
};

run().catch((error) => {
  console.error("PII governance check failed");
  console.error(error?.message || String(error));
  process.exit(1);
});
