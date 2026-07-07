import { NextResponse } from "next/server";
import { getDeliverySettings, getCollectionSlots } from "@/lib/repos/store";
import { listPostcodes, updateSettings } from "@/lib/repos/settings-admin";
import type { DeliverySettings } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/admin/settings — delivery settings + slots + postcodes
export async function GET() {
  const [settings, slots, postcodes] = await Promise.all([
    getDeliverySettings(),
    getCollectionSlots(false),
    listPostcodes(),
  ]);
  return NextResponse.json({ settings, slots, postcodes });
}

// PUT /api/admin/settings — update delivery settings
export async function PUT(req: Request) {
  try {
    const b = (await req.json()) as Partial<DeliverySettings>;
    await updateSettings({
      deliveryFee: Number(b.deliveryFee) || 0,
      freeDeliveryMin: Number(b.freeDeliveryMin) || 0,
      originPostcode: (b.originPostcode || "").toUpperCase().trim(),
      radiusMiles: Number(b.radiusMiles) || 0,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/settings PUT]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
