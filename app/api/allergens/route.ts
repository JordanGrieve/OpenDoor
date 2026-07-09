import { NextResponse } from "next/server";
import { getAllergens } from "@/lib/repos/products";

export const revalidate = 300;

// GET /api/allergens — filter options for the storefront.
export async function GET() {
  try {
    const allergens = await getAllergens();
    return NextResponse.json(
      { allergens },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("[api/allergens]", err);
    return NextResponse.json({ error: "Failed to load allergens" }, { status: 500 });
  }
}
