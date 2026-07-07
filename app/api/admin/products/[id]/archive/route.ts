import { NextResponse } from "next/server";
import { archiveProduct } from "@/lib/repos/products-admin";

export const dynamic = "force-dynamic";

// POST /api/admin/products/:id/archive  { archived }  — toggle soft-delete
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { archived } = (await req.json()) as { archived: boolean };
  await archiveProduct(Number(id), Boolean(archived));
  return NextResponse.json({ ok: true });
}
