const baseUrl = (process.env.SMOKE_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const apiBase = `${baseUrl}/api`;

const authCookie = process.env.SMOKE_AUTH_COOKIE;

const checks = [
  {
    name: "health",
    url: `${baseUrl}/health`,
    expectedStatus: 200,
    validateBody: (body) => body && body.status === "OK",
  },
  {
    name: "api-root",
    url: `${baseUrl}/api`,
    expectedStatus: 200,
    validateBody: (body) => body && typeof body.message === "string",
  },
  {
    name: "docs-disabled-v1",
    url: `${baseUrl}/api/v1/docs`,
    fallbackUrls: [`${apiBase}/docs`, `${baseUrl}/api/v1/openapi`],
    expectedStatus: 403,
    validateBody: (body) =>
      body && body.success === false && body.code === "SECURITY_DOCS_DISABLED",
  },
  {
    name: "public-health-v1",
    url: `${baseUrl}/api/v1/public/health-check`,
    fallbackUrls: [`${apiBase}/public/health-check`],
    expectedStatus: 200,
    validateBody: (body) => body && body.status === "API router is alive",
  },
  {
    name: "public-packages-v1",
    url: `${baseUrl}/api/v1/public/packages?limit=1`,
    fallbackUrls: [`${apiBase}/public/packages?limit=1`, `${apiBase}/packages?limit=1`],
    expectedStatus: 200,
    validateBody: (body) => body && body.success === true,
  },
  {
    name: "public-agent-slugs-v1",
    url: `${baseUrl}/api/v1/public/agents/slugs`,
    fallbackUrls: [`${apiBase}/public/agents/slugs`, `${apiBase}/agents/slugs`],
    expectedStatus: 200,
    validateBody: (body) => body && body.success === true,
  },
];

if (authCookie) {
  checks.push({
    name: "auth-me-v1",
    url: `${baseUrl}/api/v1/auth/me`,
    fallbackUrls: [`${apiBase}/auth/me`],
    expectedStatus: 200,
    validateBody: (body) => body && body.success === true,
    withAuthCookie: true,
  });
}

const run = async () => {
  const failures = [];

  for (const check of checks) {
    const headers = {};
    if (check.withAuthCookie) {
      headers.Cookie = authCookie;
    }

    const urlsToTry = [check.url, ...(check.fallbackUrls || [])];
    let passed = false;
    let lastFailure = null;

    for (const url of urlsToTry) {
      try {
        const response = await fetch(url, { headers });
        let parsedBody = null;

        try {
          parsedBody = await response.json();
        } catch {
          parsedBody = null;
        }

        const statusOk = response.status === check.expectedStatus;
        const bodyOk = check.validateBody(parsedBody);

        if (statusOk && bodyOk) {
          console.log(`[OK] ${check.name} -> ${url}`);
          passed = true;
          break;
        }

        lastFailure = {
          name: check.name,
          url,
          status: response.status,
          body: parsedBody,
        };
      } catch (error) {
        lastFailure = {
          name: check.name,
          url,
          error: error?.message || String(error),
        };
      }
    }

    if (!passed) {
      failures.push(
        lastFailure || { name: check.name, url: check.url, error: "Unknown failure" }
      );
      console.error(`[FAIL] ${check.name} -> ${JSON.stringify(lastFailure || {})}`);
    }
  }

  if (failures.length > 0) {
    console.error("\nSmoke check failed:");
    for (const failure of failures) {
      console.error(JSON.stringify(failure));
    }
    process.exit(1);
  }

  console.log("\nSmoke check passed.");
};

run();
