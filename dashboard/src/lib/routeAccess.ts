import type { DashboardRole } from "./validateSession";

export const DEFAULT_ROUTES: Record<DashboardRole, string> = {
  ADMIN: "/admin",
  FINANCE: "/finance",
  STAFF: "/staff",
  AGEN: "/agen",
  JAMAAH: "/jamaah",
  CALON_JAMAAH: "/calon-jamaah",
};

export const ROLE_PREFIXES: Record<DashboardRole, string[]> = {
  ADMIN: ["/admin"],
  FINANCE: ["/finance"],
  STAFF: ["/staff"],
  AGEN: ["/agen"],
  JAMAAH: ["/jamaah"],
  CALON_JAMAAH: ["/calon-jamaah"],
};

const STAFF_BLOCKED_PREFIXES = ["/staff/reports", "/staff/transactions"];
const FINANCE_BLOCKED_PATTERNS = [
  /^\/finance\/users\/create(?:\/|$)/,
  /^\/finance\/users\/[^/]+\/edit(?:\/|$)/,
  /^\/finance\/packages\/create(?:\/|$)/,
  /^\/finance\/packages\/[^/]+\/edit(?:\/|$)/,
  /^\/finance\/packages\/[^/]+\/itinerary(?:\/|$)/,
  /^\/finance\/jamaah\/create(?:\/|$)/,
  /^\/finance\/jamaah\/[^/]+\/edit(?:\/|$)/,
  /^\/finance\/agen\/[^/]+\/edit(?:\/|$)/,
];

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const getRoleRedirectPath = (role: DashboardRole, pathname: string) => {
  if (role === "STAFF" && STAFF_BLOCKED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return DEFAULT_ROUTES.STAFF;
  }

  if (role === "FINANCE" && FINANCE_BLOCKED_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return DEFAULT_ROUTES.FINANCE;
  }

  const isAllowed = ROLE_PREFIXES[role].some((prefix) => matchesPrefix(pathname, prefix));
  if (!isAllowed) {
    return DEFAULT_ROUTES[role];
  }

  return null;
};
