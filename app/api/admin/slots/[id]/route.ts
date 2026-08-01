import { NextResponse } from "next/server";
import { removeSlot, setSlotActive, setSlotCapacity } from "@/lib/repos/settings-admin";
import { parseCapacity } from "@/lib/slot-capacity";

export const dynamic = "force-dynamic";

// PATCH /api/admin/slots/:id  { active?, capacity? }
// capacity: a number, or null/"" for unlimited.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { active?: boolean; capacity?: unknown };

  if ("capacity" in body) {
    await setSlotCapacity(Number(id), parseCapacity(body.capacity));
  }
  if (typeof body.active === "boolean") {
    await setSlotActive(Number(id), body.active);
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/slots/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await removeSlot(Number(id));
  return NextResponse.json({ ok: true });
}
