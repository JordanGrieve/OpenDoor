import { NextResponse } from "next/server";
import { getProductSummaries } from "@/lib/repos/products";

export const dynamic = "force-dynamic";

// GET /api/products — active catalogue for the storefront grid.
export async function GET() {
  try {
    const products = await getProductSummaries();
    return NextResponse.json({ products });
  } catch (err) {
    console.error("[api/products]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
