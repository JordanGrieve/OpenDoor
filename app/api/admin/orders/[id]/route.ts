import { NextResponse } from "next/server";
import { getOrderById, getOrderNotifications, markCancelled } from "@/lib/repos/orders";
import { getStripe } from "@/lib/services/stripe";
import { notifyCancelled } from "@/lib/services/notify";

export const dynamic = "force-dynamic";

// GET /api/admin/orders/:id — full detail + notification history
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(Number(id));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const notifications = await getOrderNotifications(order.id);
  return NextResponse.json({ order, notifications });
}

// DELETE /api/admin/orders/:id — owner cancels (auto-refunds a real payment)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await getOrderById(Number(id));
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let refunded = false;
    const stripe = getStripe();
    if (stripe && order.stripePaymentId && !order.stripePaymentId.startsWith("dev")) {
      try {
        await stripe.refunds.create({ payment_intent: order.stripePaymentId });
        refunded = true;
      } catch (err) {
        console.error("[admin cancel] refund failed", err);
      }
    } else if (order.stripePaymentId) {
      refunded = true;
    }

    const updated = await markCancelled(order.id, refunded);
    if (updated) await notifyCancelled(updated, refunded);
    return NextResponse.json({ order: updated, refunded });
  } catch (err) {
    console.error("[admin/orders DELETE]", err);
    return NextResponse.json({ error: "Cancellation failed" }, { status: 500 });
  }
}
