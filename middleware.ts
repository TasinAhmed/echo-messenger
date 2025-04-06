import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const authRegex = /^\/auth\/(login|register)(\/.*)?$/;

  if (!sessionCookie && !authRegex.test(pathname)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (sessionCookie && authRegex.test(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ], // Specify the routes the middleware applies to
};
