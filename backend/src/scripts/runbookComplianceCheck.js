import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runbookPath = path.resolve(__dirname, "../../../docs/DEPLOYMENT_RUNBOOK.md");

const requiredSnippets = [
  "### Mapping checklist -> command/script",
  "### Catatan eksekusi smoke",
  "## 10.3 Evidence Template (Post Deploy / Restore)",
  "npm run smoke",
  "npm run test:menu-routes",
  "SECURITY_DOCS_DISABLED",
  "npm run check:migrations",
  "npm run check:prod-env",
  "npm run db:migrate",
  "ENABLE_RUNTIME_SCHEMA_PATCH",
  "npm run backup:uploads",
  "npm run restore:uploads",
  "npm run restore:smoke",
];

const run = async () => {
  const content = await fs.readFile(runbookPath, "utf8");
  const missing = requiredSnippets.filter((snippet) => !content.includes(snippet));

  if (missing.length > 0) {
    console.error("Runbook compliance check failed");
    for (const snippet of missing) {
      console.error(`- Missing snippet: ${snippet}`);
    }
    process.exit(1);
  }

  console.log("Runbook compliance check passed");
};

run().catch((error) => {
  console.error("Runbook compliance check failed");
  console.error(error?.message || String(error));
  process.exit(1);
});
