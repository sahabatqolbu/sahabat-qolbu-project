import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/landing/index.html";

  return NextResponse.redirect(target);
}
