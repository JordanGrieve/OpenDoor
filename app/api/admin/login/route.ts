import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, adminPassword, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/login  { password }
export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || password !== adminPassword()) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
