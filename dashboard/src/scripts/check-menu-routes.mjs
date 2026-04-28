import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP_ROOTS = [
  path.join(ROOT, "src", "app", "(dashboard)"),
  path.join(ROOT, "src", "app", "(mobile)"),
];

const MENU_CONFIG_PATH = path.join(ROOT, "src", "lib", "menu-config.ts");

const extractRoutesFromMenuConfig = () => {
  const source = fs.readFileSync(MENU_CONFIG_PATH, "utf8");
  const hrefRegex = /href:\s*"([^"]+)"/g;
  const routes = new Set();

  let match = hrefRegex.exec(source);
  while (match) {
    routes.add(match[1]);
    match = hrefRegex.exec(source);
  }

  return routes;
};

const routeExists = (href) => {
  const normalized = href.replace(/^\//, "");
  return APP_ROOTS.some((appRoot) => {
    const routePath = path.join(appRoot, ...normalized.split("/"));
    const candidates = [
      path.join(routePath, "page.tsx"),
      path.join(routePath, "page.ts"),
      path.join(routePath, "page.jsx"),
      path.join(routePath, "page.js"),
    ];
    return candidates.some((candidate) => fs.existsSync(candidate));
  });
};

const readPageSource = (href) => {
  const normalized = href.replace(/^\//, "");
  const candidates = APP_ROOTS.flatMap((appRoot) => {
    const routePath = path.join(appRoot, ...normalized.split("/"));
    return [
      path.join(routePath, "page.tsx"),
      path.join(routePath, "page.ts"),
      path.join(routePath, "page.jsx"),
      path.join(routePath, "page.js"),
    ];
  });

  const pageFile = candidates.find((candidate) => fs.existsSync(candidate));
  if (!pageFile) return null;
  return fs.readFileSync(pageFile, "utf8");
};

const isPlaceholderPage = (href) => {
  const source = readPageSource(href);
  if (!source) return false;
  return /coming\s+soon/i.test(source);
};

const allRoutes = extractRoutesFromMenuConfig();

const missing = [...allRoutes]
  .filter((href) => !routeExists(href))
  .sort((a, b) => a.localeCompare(b));

const placeholders = [...allRoutes]
  .filter((href) => routeExists(href) && isPlaceholderPage(href))
  .sort((a, b) => a.localeCompare(b));

if (missing.length === 0) {
  console.log("[menu-route-check] OK: semua menu href punya page.");
  if (placeholders.length > 0) {
    console.warn("[menu-route-check] Placeholder routes detected:");
    for (const href of placeholders) {
      console.warn(`- ${href}`);
    }
  }
  process.exit(0);
}

console.error("[menu-route-check] Missing routes:");
for (const href of missing) {
  console.error(`- ${href}`);
}
process.exit(1);
