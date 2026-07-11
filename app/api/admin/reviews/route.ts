import { NextResponse } from "next/server";
import { listAllReviews } from "@/lib/repos/reviews";

export const dynamic = "force-dynamic";

// GET /api/admin/reviews — moderation queue (all statuses)
export async function GET() {
  return NextResponse.json({ reviews: await listAllReviews() });
}
