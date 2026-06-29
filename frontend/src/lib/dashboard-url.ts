export type DashboardRole =
  "ADMIN" | "FINANCE" | "STAFF" | "AGEN" | "JAMAAH" | "CALON_JAMAAH";

const rolePaths: Record<DashboardRole, string> = {
  ADMIN: "/admin",
  FINANCE: "/finance",
  STAFF: "/staff",
  AGEN: "/agen",
  JAMAAH: "/jamaah",
  CALON_JAMAAH: "/calon-jamaah",
};

export const getDashboardBaseUrl = () =>
  (
    process.env.NEXT_PUBLIC_DASHBOARD_URL ||
    "https://dashboard.sahabatqolbu.com"
  ).replace(/\/+$/, "");

export const getDashboardUrl = (role?: string | null) => {
  const baseUrl = getDashboardBaseUrl();
  const path =
    role && role in rolePaths ? rolePaths[role as DashboardRole] : "";

  return `${baseUrl}${path}`;
};

export const getCalonJamaahPackageDashboardUrl = (slug: string) =>
  `${getDashboardBaseUrl()}/calon-jamaah/packages/${encodeURIComponent(slug)}`;

export const getCalonJamaahRegisterUrl = (
  nextPath = "/calon-jamaah/packages",
) =>
  `${getDashboardBaseUrl()}/login?tab=register&next=${encodeURIComponent(nextPath)}`;

export const getCalonJamaahPackageRegisterUrl = (slug: string) => {
  const nextPath = `/calon-jamaah/packages/${slug}`;
  return getCalonJamaahRegisterUrl(nextPath);
};
