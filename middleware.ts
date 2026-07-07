import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Admin guard: protects /dashboard/* and /api/admin/* behind the owner session.
async function adminGuard(req: NextRequest): Promise<Response> {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/dashboard/login";
  const isAuthApi = pathname === "/api/admin/login" || pathname === "/api/admin/logout";

  const guarded =
    (pathname.startsWith("/dashboard") && !isLoginPage) ||
    (pathname.startsWith("/api/admin") && !isAuthApi);

  if (guarded) {
    const valid = await isValidSession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!valid) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const url = new URL("/dashboard/login", req.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isLoginPage && (await isValidSession(req.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// When Clerk is enabled, run its middleware (so customer auth works on the
// storefront) and still apply the admin guard. Otherwise just the guard.
export default clerkEnabled
  ? clerkMiddleware(async (_auth, req) => adminGuard(req as unknown as NextRequest))
  : adminGuard;

export const config = {
  // run on everything except static assets + files with extensions
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)", "/api/:path*"],
};
