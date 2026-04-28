import { NextRequest, NextResponse } from "next/server";
import { getRoleRedirectPath } from "@/lib/routeAccess";
import { validateSession } from "@/lib/validateSession";

const PROTECTED_PREFIXES = ["/admin", "/finance", "/staff", "/agen", "/jamaah"];

const redirectToLogin = (request: NextRequest, pathname: string) => {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/finance/:path*", "/staff/:path*", "/agen/:path*", "/jamaah/:path*"],
};
