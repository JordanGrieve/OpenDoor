import { NextResponse } from "next/server";
import { adjustIngredientStock } from "@/lib/repos/stock";

export const dynamic = "force-dynamic";

// PATCH /api/admin/ingredients/:id  { stock }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { stock } = (await req.json()) as { stock: number };
    if (stock == null || Number.isNaN(Number(stock))) {
      return NextResponse.json({ error: "stock must be a number" }, { status: 400 });
    }
    await adjustIngredientStock(Number(id), Number(stock));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/ingredients PATCH]", err);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}
