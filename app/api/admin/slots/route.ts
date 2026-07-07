import { NextResponse } from "next/server";
import { getCollectionSlots } from "@/lib/repos/store";
import { addSlot } from "@/lib/repos/settings-admin";

export const dynamic = "force-dynamic";

// GET /api/admin/slots — all slots (incl inactive)
export async function GET() {
  return NextResponse.json({ slots: await getCollectionSlots(false) });
}

// POST /api/admin/slots  { slotTime, label }
export async function POST(req: Request) {
  const { slotTime, label } = (await req.json()) as { slotTime?: string; label?: string };
  if (!slotTime || !label) return NextResponse.json({ error: "Time and label required" }, { status: 400 });
  await addSlot(slotTime, label);
  return NextResponse.json({ ok: true });
}
