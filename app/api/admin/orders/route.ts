import { NextResponse } from "next/server";
import { listOrders } from "@/lib/repos/orders";

export const dynamic = "force-dynamic";

// GET /api/admin/orders?status=&type=&from=&to=
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orders = await listOrders({
      status: searchParams.get("status"),
      type: searchParams.get("type"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[admin/orders]", err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
