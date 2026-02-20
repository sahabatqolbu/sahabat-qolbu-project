const buildCheck = ({
  name,
  url,
  expectedStatus = 200,
  cookie,
  severityOnFail = "SEV-2",
  code,
}) => ({
  name,
  url,
  expectedStatus,
  cookie,
  severityOnFail,
  code,
});

const checks = [
  buildCheck({
    name: "auth-session-check",
    url: process.env.AUTH_GUARD_URL,
    expectedStatus: Number(process.env.AUTH_GUARD_EXPECTED_STATUS || 200),
    cookie: process.env.AUTH_GUARD_COOKIE,
    severityOnFail: "SEV-1",
    code: "AUTH_ANOMALY",
  }),
  buildCheck({
    name: "payment-flow-check",
    url: process.env.PAYMENT_GUARD_URL,
    expectedStatus: Number(process.env.PAYMENT_GUARD_EXPECTED_STATUS || 200),
    cookie: process.env.PAYMENT_GUARD_COOKIE || process.env.AUTH_GUARD_COOKIE,
    severityOnFail: "SEV-1",
    code: "PAYMENT_FLOW_ANOMALY",
  }),
  buildCheck({
    name: "public-health-check",
    url: process.env.PUBLIC_HEALTH_GUARD_URL,
    expectedStatus: Number(process.env.PUBLIC_HEALTH_GUARD_EXPECTED_STATUS || 200),
    severityOnFail: "SEV-2",
    code: "PUBLIC_API_ANOMALY",
  }),
].filter((item) => Boolean(item.url));

if (checks.length === 0) {
  console.error("Critical alert probe failed: no guard URL configured");
  process.exit(1);
}

const run = async () => {
  const failures = [];

  for (const check of checks) {
    const headers = {};
    if (check.cookie) {
      headers.Cookie = check.cookie;
    }

    try {
      const response = await fetch(check.url, { headers });
      const ok = response.status === check.expectedStatus;
      if (ok) {
        console.log(`[OK] ${check.name} -> ${check.url}`);
        continue;
      }

      failures.push({
        name: check.name,
        code: check.code,
        severity: check.severityOnFail,
        url: check.url,
        expectedStatus: check.expectedStatus,
        actualStatus: response.status,
      });
    } catch (error) {
      failures.push({
        name: check.name,
        code: check.code,
        severity: check.severityOnFail,
        url: check.url,
        error: error?.message || String(error),
      });
    }
  }

  if (failures.length === 0) {
    console.log("Critical alert probe passed");
    return;
  }

  const severityRank = { "SEV-1": 1, "SEV-2": 2, "SEV-3": 3 };
  const topSeverity = failures
    .map((item) => item.severity)
    .sort((a, b) => severityRank[a] - severityRank[b])[0] || "SEV-3";

  const report = {
    topSeverity,
    failures,
    timestamp: new Date().toISOString(),
  };

  console.error("Critical alert probe failed");
  console.error(JSON.stringify(report));
  process.exit(1);
};

run();
