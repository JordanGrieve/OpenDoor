import { NextResponse } from "next/server";
import { removeSlot, setSlotActive } from "@/lib/repos/settings-admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/slots/:id  { active }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { active } = (await req.json()) as { active: boolean };
  await setSlotActive(Number(id), Boolean(active));
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/slots/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await removeSlot(Number(id));
  return NextResponse.json({ ok: true });
}
