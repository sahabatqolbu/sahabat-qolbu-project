import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../../..");
const contractPath = path.join(projectRoot, "docs/API_CONTRACT.md");
const openApiPath = path.join(projectRoot, "backend/openapi/openapi.v1.baseline.yaml");

const requiredContractSnippets = [
  "## 11) Checklist API Release",
  "## 12) Governance di Repository",
  ".github/pull_request_template.md",
  "backend/openapi/openapi.v1.baseline.yaml",
];

const requiredOpenApiSnippets = [
  "openapi: 3.0.3",
  "servers:",
  "- url: /api",
  "- url: /api/v1",
  "/auth/login:",
  "/public/packages:",
  "/jamaah/admin/payments/{paymentId}/reject:",
  "/admin/transactions/{id}/verify:",
];

const run = async () => {
  const contract = await fs.readFile(contractPath, "utf8");
  const openApi = await fs.readFile(openApiPath, "utf8");

  const missingContract = requiredContractSnippets.filter((s) => !contract.includes(s));
  const missingOpenApi = requiredOpenApiSnippets.filter((s) => !openApi.includes(s));

  if (missingContract.length > 0 || missingOpenApi.length > 0) {
    console.error("API contract compliance check failed");
    for (const item of missingContract) {
      console.error(`- Missing API_CONTRACT snippet: ${item}`);
    }
    for (const item of missingOpenApi) {
      console.error(`- Missing OpenAPI snippet: ${item}`);
    }
    process.exit(1);
  }

  console.log("API contract compliance check passed");
};

run().catch((error) => {
  console.error("API contract compliance check failed");
  console.error(error?.message || String(error));
  process.exit(1);
});
