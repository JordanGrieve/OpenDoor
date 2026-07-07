import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

// Protects all /dashboard/* and /api/admin/* routes behind the admin session.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/dashboard/login";
  const isAuthApi = pathname === "/api/admin/login" || pathname === "/api/admin/logout";

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await isValidSession(token);

  const guarded =
    (pathname.startsWith("/dashboard") && !isLoginPage) ||
    (pathname.startsWith("/api/admin") && !isAuthApi);

  if (guarded && !valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/dashboard/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // already signed in → skip the login page
  if (isLoginPage && valid) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};
