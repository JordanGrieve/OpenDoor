import { NextResponse } from "next/server";
import { getCollectionSlots, getSlotAvailability } from "@/lib/repos/store";

export const dynamic = "force-dynamic";

// GET /api/slots?date=YYYY-MM-DD — collection slots for a date. With a date
// each slot also carries its live booking count, so full ones can be shown
// as unavailable rather than silently disappearing.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const slots = date ? await getSlotAvailability(date) : await getCollectionSlots(true);
    return NextResponse.json({ date, slots });
  } catch (err) {
    console.error("[api/slots]", err);
    return NextResponse.json({ error: "Failed to load slots" }, { status: 500 });
  }
}
