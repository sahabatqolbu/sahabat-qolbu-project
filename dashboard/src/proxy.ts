import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_ROUTES, getRoleRedirectPath } from "@/lib/routeAccess";
import { validateSession } from "@/lib/validateSession";

const PROTECTED_PREFIXES = [
  "/admin",
  "/finance",
  "/staff",
  "/agen",
  "/jamaah",
  "/calon-jamaah",
];

const safeInternalPath = (pathname: string) => {
  if (!pathname.startsWith("/")) return "/";
  if (pathname.startsWith("//")) return "/";
  return pathname;
};

const redirectToLogin = (request: NextRequest, pathname: string) => {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", safeInternalPath(pathname));
  return NextResponse.redirect(loginUrl);
};

// Penanda "sudah punya akun" untuk web publik (tombol Daftar/Masuk). Bukan token, aman dibaca JS.
const markAccount = (request: NextRequest, response: NextResponse) => {
  const host = request.nextUrl.hostname;
  response.cookies.set("sq_account", "1", {
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    ...(host.startsWith("dashboard.") ? { domain: host.slice("dashboard.".length) } : {}),
  });
  return response;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sudah login: halaman login langsung diteruskan ke dashboard, tidak minta login ulang.
  if (pathname === "/login") {
    const token = request.cookies.get("access_token")?.value;
    const session = token ? await validateSession(token) : null;
    if (!session) return NextResponse.next();
    const wanted = request.nextUrl.searchParams.get("redirect") || request.nextUrl.searchParams.get("next");
    const target = wanted ? safeInternalPath(wanted) : DEFAULT_ROUTES[session.role];
    return markAccount(request, NextResponse.redirect(new URL(target === "/" ? DEFAULT_ROUTES[session.role] : target, request.url)));
  }
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    return redirectToLogin(request, pathname);
  }

  const session = await validateSession(token);
  if (!session) {
    return redirectToLogin(request, pathname);
  }

  const redirectPath = getRoleRedirectPath(session.role, pathname);
  if (redirectPath) {
    const target = new URL(redirectPath, request.url);
    // Keep filters/pagination when translating an /admin link to the role alias.
    if (redirectPath !== DEFAULT_ROUTES[session.role]) {
      target.search = request.nextUrl.search;
    }
    return markAccount(request, NextResponse.redirect(target));
  }

  return markAccount(request, NextResponse.next());
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/finance/:path*",
    "/staff/:path*",
    "/agen/:path*",
    "/jamaah/:path*",
    "/calon-jamaah/:path*",
  ],
};
