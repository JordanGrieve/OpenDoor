import { NextResponse } from "next/server";
import { getDeliverySettings, getDeliveryPrefixes } from "@/lib/repos/store";

export const revalidate = 300;

// GET /api/settings/delivery — fee, free-delivery threshold, area.
export async function GET() {
  try {
    const [settings, prefixes] = await Promise.all([
      getDeliverySettings(),
      getDeliveryPrefixes(),
    ]);
    return NextResponse.json(
      { ...settings, postcodePrefixes: prefixes },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("[api/settings/delivery]", err);
    return NextResponse.json({ error: "Failed to load delivery settings" }, { status: 500 });
  }
}
