import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const session = await auth();
  if (!session) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const loginUrl = new URL(`${basePath}/login`, new URL(request.url).origin);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register).*)"],
};
