import { NextResponse } from "next/server";
import { getAllergens } from "@/lib/repos/products";

export const dynamic = "force-dynamic";

// GET /api/allergens — filter options for the storefront.
export async function GET() {
  try {
    const allergens = await getAllergens();
    return NextResponse.json({ allergens });
  } catch (err) {
    console.error("[api/allergens]", err);
    return NextResponse.json({ error: "Failed to load allergens" }, { status: 500 });
  }
}
