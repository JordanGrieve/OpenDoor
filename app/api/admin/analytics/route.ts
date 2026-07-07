import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/repos/analytics";
import { isoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

// GET /api/admin/analytics?from=&to=  (defaults: last 30 days)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get("to") || isoDate(new Date());
    const from = searchParams.get("from") || isoDate(new Date(Date.now() - 29 * 864e5));
    return NextResponse.json(await getAnalytics(from, to));
  } catch (err) {
    console.error("[admin/analytics]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
