import { NextResponse } from "next/server";
import { listIngredients } from "@/lib/repos/products-admin";

export const dynamic = "force-dynamic";

// GET /api/admin/ingredients — for recipe editing + stock
export async function GET() {
  return NextResponse.json({ ingredients: await listIngredients() });
}
