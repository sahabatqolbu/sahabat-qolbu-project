const checks = [
  {
    name: "backend-health",
    url: process.env.BACKEND_HEALTHCHECK_URL,
    expectedStatus: 200,
  },
  {
    name: "backend-public-health",
    url: process.env.BACKEND_PUBLIC_HEALTHCHECK_URL,
    expectedStatus: 200,
  },
  {
    name: "backend-docs-block",
    url: process.env.BACKEND_DOCS_BLOCK_URL,
    expectedStatus: 403,
    validateBody: (body) => body && body.code === "SECURITY_DOCS_DISABLED",
  },
  {
    name: "dashboard-health",
    url: process.env.DASHBOARD_HEALTHCHECK_URL,
    expectedStatus: 200,
  },
  {
    name: "frontend-health",
    url: process.env.FRONTEND_HEALTHCHECK_URL,
    expectedStatus: 200,
  },
];

const enabledChecks = checks.filter((item) => Boolean(item.url));

if (enabledChecks.length === 0) {
  console.error("Uptime probe failed: no healthcheck URL configured");
  process.exit(1);
}

const run = async () => {
  const failures = [];

  for (const check of enabledChecks) {
    try {
      const response = await fetch(check.url);
      let body = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      const statusOk = response.status === check.expectedStatus;
      const bodyOk = check.validateBody ? check.validateBody(body) : true;

      if (!statusOk || !bodyOk) {
        failures.push({
          name: check.name,
          url: check.url,
          expectedStatus: check.expectedStatus,
          actualStatus: response.status,
          body,
        });
        continue;
      }

      console.log(`[OK] ${check.name} -> ${check.url}`);
    } catch (error) {
      failures.push({
        name: check.name,
        url: check.url,
        error: error?.message || String(error),
      });
    }
  }

  if (failures.length > 0) {
    console.error("Uptime probe failed");
    for (const failure of failures) {
      console.error(JSON.stringify(failure));
    }
    process.exit(1);
  }

  console.log("Uptime probe passed");
};

run();
