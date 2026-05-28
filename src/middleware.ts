import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.endsWith("/login") || pathname.endsWith("/register");
  const basePath = process.env.BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL(`${basePath}/login`, request.url));
  }

  const isAdminPage = pathname === `${basePath}/admin` || pathname.startsWith(`${basePath}/admin/`);
  if (isAdminPage && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL(`${basePath}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
