import { NextResponse } from "next/server";
import { getAvailability, setAvailability } from "@/lib/repos/products-admin";
import { isoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

// GET /api/admin/products/:id/availability — next 10 days
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const days = await getAvailability(Number(id), isoDate(new Date()), 10);
    return NextResponse.json({ days });
  } catch (err) {
    console.error("[admin/products/availability GET]", err);
    return NextResponse.json({ days: [] });
  }
}

// PATCH /api/admin/products/:id/availability  { day, available }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { day, available } = (await req.json()) as { day: string; available: boolean };
  if (!day) return NextResponse.json({ error: "day required" }, { status: 400 });
  await setAvailability(Number(id), day, Boolean(available));
  return NextResponse.json({ ok: true });
}
