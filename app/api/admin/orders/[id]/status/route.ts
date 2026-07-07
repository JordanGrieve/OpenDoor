import { NextResponse } from "next/server";
import { getOrderById, updateOrderStatus } from "@/lib/repos/orders";
import { notifyStatusChange } from "@/lib/services/notify";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID: OrderStatus[] = ["pending", "confirmed", "ready", "collected", "dispatched", "cancelled", "refunded"];

// PATCH /api/admin/orders/:id/status  { status }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = (await req.json()) as { status: OrderStatus };
    if (!VALID.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const before = await getOrderById(Number(id));
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const order = await updateOrderStatus(Number(id), status);
    // notify the customer when a box becomes ready or is dispatched
    if (order && (status === "ready" || status === "dispatched") && before.status !== status) {
      await notifyStatusChange(order, status);
    }
    return NextResponse.json({ order });
  } catch (err) {
    console.error("[admin/orders status]", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
