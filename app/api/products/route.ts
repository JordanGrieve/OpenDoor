import { NextResponse } from "next/server";
import { getProductSummaries } from "@/lib/repos/products";

// Cache the catalogue at the edge for 60s (admin edits appear within a minute).
export const revalidate = 60;

// GET /api/products — active catalogue for the storefront grid.
export async function GET() {
  try {
    const products = await getProductSummaries();
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (err) {
    console.error("[api/products]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
