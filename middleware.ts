import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { SESSION_COOKIE, isValidSession, adminVerifiedToken } from "@/lib/auth";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const isAdminArea = createRouteMatcher(["/dashboard(.*)", "/api/admin(.*)"]);
const ADMIN_VERIFIED_COOKIE = "od_admin_verified";

// ── Clerk path: owner login + email allowlist for the dashboard ──
const withClerk = clerkMiddleware(async (auth, req) => {
  if (!isAdminArea(req)) return NextResponse.next();
  // the "not authorised" page must stay reachable to avoid a redirect loop
  if (req.nextUrl.pathname === "/dashboard/denied") return NextResponse.next();

  const isApi = req.nextUrl.pathname.startsWith("/api/");
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (allowedEmails.length) {
    // Fast path: this user already passed the allowlist recently (signed cookie).
    // Only trusted when SESSION_SECRET is set — otherwise the token would be
    // signed with a well-known dev default and could be forged.
    const canFastPath = Boolean(process.env.SESSION_SECRET);
    const verified = await adminVerifiedToken(userId);
    if (canFastPath && req.cookies.get(ADMIN_VERIFIED_COOKIE)?.value === verified) {
      return NextResponse.next();
    }
    // Slow path: verify the email against Clerk once, then cache it.
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email || !allowedEmails.includes(email)) {
      if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return NextResponse.redirect(new URL("/dashboard/denied", req.url));
    }
    const res = NextResponse.next();
    res.cookies.set(ADMIN_VERIFIED_COOKIE, verified, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30, // re-verify every 30 min
    });
    return res;
  }
  return NextResponse.next();
});

// ── Fallback path: password session cookie (when Clerk isn't configured) ──
async function passwordGuard(req: NextRequest): Promise<Response> {
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

export default clerkEnabled ? withClerk : passwordGuard;

// Only run on the admin surface — the storefront is entirely Clerk-free.
export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*"],
};
