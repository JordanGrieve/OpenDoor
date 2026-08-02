import { NextResponse } from "next/server";
import { adjustIngredientStock, setIngredientCost } from "@/lib/repos/stock";
import { parseCost } from "@/lib/margin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/ingredients/:id  { stock?, costPerUnit? }
// costPerUnit: a number, or null/"" meaning "not entered yet".
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { stock?: unknown; costPerUnit?: unknown };

    if ("costPerUnit" in body) {
      await setIngredientCost(Number(id), parseCost(body.costPerUnit));
    }

    if ("stock" in body) {
      if (body.stock == null || Number.isNaN(Number(body.stock))) {
        return NextResponse.json({ error: "stock must be a number" }, { status: 400 });
      }
      await adjustIngredientStock(Number(id), Number(body.stock));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/ingredients PATCH]", err);
    return NextResponse.json({ error: "Failed to update ingredient" }, { status: 500 });
  }
}
