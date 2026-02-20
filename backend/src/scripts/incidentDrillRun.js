import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactsDir = path.resolve(__dirname, "../../.artifacts");
const reportPath = path.join(artifactsDir, "incident-drill-report.json");

const scenario = process.env.INCIDENT_DRILL_SCENARIO || "auth-payment-guard";

const checks = [
  {
    name: "auth-guard",
    url: process.env.AUTH_GUARD_URL,
    expectedStatus: Number(process.env.AUTH_GUARD_EXPECTED_STATUS || 200),
    cookie: process.env.AUTH_GUARD_COOKIE,
    severityOnFail: "SEV-1",
  },
  {
    name: "payment-guard",
    url: process.env.PAYMENT_GUARD_URL,
    expectedStatus: Number(process.env.PAYMENT_GUARD_EXPECTED_STATUS || 200),
    cookie: process.env.PAYMENT_GUARD_COOKIE || process.env.AUTH_GUARD_COOKIE,
    severityOnFail: "SEV-1",
  },
  {
    name: "backend-health",
    url: process.env.BACKEND_HEALTHCHECK_URL,
    expectedStatus: 200,
    severityOnFail: "SEV-2",
  },
  {
    name: "docs-block",
    url: process.env.BACKEND_DOCS_BLOCK_URL,
    expectedStatus: 403,
    severityOnFail: "SEV-2",
    validateBody: (body) => body && body.code === "SECURITY_DOCS_DISABLED",
  },
].filter((item) => Boolean(item.url));

const severityRank = { "SEV-1": 1, "SEV-2": 2, "SEV-3": 3 };

const rankSeverity = (failures) => {
  if (failures.length === 0) return "SEV-3";
  return failures
    .map((item) => item.severity)
    .sort((a, b) => severityRank[a] - severityRank[b])[0] || "SEV-3";
};

const run = async () => {
  if (checks.length === 0) {
    console.error("Incident drill failed: no guard URL configured");
    process.exit(1);
  }

  const startedAt = new Date().toISOString();
  const results = [];
  const failures = [];

  for (const check of checks) {
    const headers = {};
    if (check.cookie) {
      headers.Cookie = check.cookie;
    }

    try {
      const response = await fetch(check.url, { headers });
      let body = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      const statusOk = response.status === check.expectedStatus;
      const bodyOk = check.validateBody ? check.validateBody(body) : true;
      const ok = statusOk && bodyOk;

      const result = {
        name: check.name,
        url: check.url,
        expectedStatus: check.expectedStatus,
        actualStatus: response.status,
        ok,
      };

      results.push(result);

      if (!ok) {
        failures.push({
          ...result,
          severity: check.severityOnFail,
          body,
        });
      }
    } catch (error) {
      const result = {
        name: check.name,
        url: check.url,
        expectedStatus: check.expectedStatus,
        ok: false,
        error: error?.message || String(error),
      };
      results.push(result);
      failures.push({ ...result, severity: check.severityOnFail });
    }
  }

  const report = {
    scenario,
    startedAt,
    finishedAt: new Date().toISOString(),
    topSeverity: rankSeverity(failures),
    totalChecks: results.length,
    failures: failures.length,
    results,
    followUp: failures.length
      ? "Escalate per INCIDENT_RESPONSE_PLAYBOOK.md and attach this report"
      : "No anomaly detected; record evidence in drill log",
  };

  await fs.mkdir(artifactsDir, { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Incident drill report saved: ${reportPath}`);

  if (failures.length > 0) {
    console.error("Incident drill detected failures");
    console.error(JSON.stringify({ topSeverity: report.topSeverity, failures }));
    process.exit(1);
  }

  console.log("Incident drill passed");
};

run().catch((error) => {
  console.error("Incident drill failed");
  console.error(error?.message || String(error));
  process.exit(1);
});
