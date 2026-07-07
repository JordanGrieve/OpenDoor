import { NextResponse } from "next/server";
import { removeProductImage } from "@/lib/repos/products-admin";

export const dynamic = "force-dynamic";

// DELETE /api/admin/products/:id/images/:imageId
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const { imageId } = await params;
  await removeProductImage(Number(imageId));
  return NextResponse.json({ ok: true });
}
