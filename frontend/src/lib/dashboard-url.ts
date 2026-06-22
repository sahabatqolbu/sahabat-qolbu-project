export type DashboardRole = "ADMIN" | "FINANCE" | "STAFF" | "AGEN" | "JAMAAH";

const rolePaths: Record<DashboardRole, string> = {
  ADMIN: "/admin",
  FINANCE: "/finance",
  STAFF: "/staff",
  AGEN: "/agen",
  JAMAAH: "/jamaah",
};

export const getDashboardBaseUrl = () =>
  (process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://dashboard.sahabatqolbu.com")
    .replace(/\/+$/, "");

export const getDashboardUrl = (role?: string | null) => {
  const baseUrl = getDashboardBaseUrl();
  const path = role && role in rolePaths ? rolePaths[role as DashboardRole] : "";

  return `${baseUrl}${path}`;
};

