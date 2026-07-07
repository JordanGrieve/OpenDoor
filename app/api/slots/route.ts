import { NextResponse } from "next/server";
import { getCollectionSlots } from "@/lib/repos/store";

export const dynamic = "force-dynamic";

// GET /api/slots?date=YYYY-MM-DD — available collection slots for a date.
// (Slots are the same each day; the date param lets us later exclude
//  fully-booked slots per day.)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const slots = await getCollectionSlots(true);
    return NextResponse.json({ date, slots });
  } catch (err) {
    console.error("[api/slots]", err);
    return NextResponse.json({ error: "Failed to load slots" }, { status: 500 });
  }
}
