import { NextResponse } from "next/server";
import { sitePassword, lockToken } from "@/lib/auth";
import { LOCK_COOKIE, LOCK_MAX_AGE } from "@/lib/site-lock";
import { rateLimitGuard } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// POST /api/lock  { password }
// Unlocks the storefront for this browser. Storefront access only —
// the dashboard keeps its own, separate auth.
export async function POST(req: Request) {
  const limited = rateLimitGuard(req, "lock", "Too many attempts — please wait a few minutes and try again.");
  if (limited) return limited;

  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || password !== sitePassword()) {
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(LOCK_COOKIE, await lockToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LOCK_MAX_AGE,
  });
  return res;
}
