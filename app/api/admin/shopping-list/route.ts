import { NextResponse } from "next/server";
import { getShoppingList } from "@/lib/repos/stock";

export const dynamic = "force-dynamic";

// GET /api/admin/shopping-list — grouped by ingredient category
export async function GET() {
  try {
    return NextResponse.json({ groups: await getShoppingList() });
  } catch (err) {
    console.error("[admin/shopping-list]", err);
    return NextResponse.json({ error: "Failed to build shopping list" }, { status: 500 });
  }
}
