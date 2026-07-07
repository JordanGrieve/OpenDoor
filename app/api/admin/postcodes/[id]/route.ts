import { NextResponse } from "next/server";
import { removePostcode, setPostcodeActive } from "@/lib/repos/settings-admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/postcodes/:id  { active }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { active } = (await req.json()) as { active: boolean };
  await setPostcodeActive(Number(id), Boolean(active));
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/postcodes/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await removePostcode(Number(id));
  return NextResponse.json({ ok: true });
}
