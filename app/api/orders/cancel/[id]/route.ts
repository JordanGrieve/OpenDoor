import { NextResponse } from "next/server";
import { getOrderById, markCancelled } from "@/lib/repos/orders";
import { getStripe } from "@/lib/services/stripe";
import { notifyCancelled } from "@/lib/services/notify";
import { isCancellable } from "@/lib/orders-policy";

export const dynamic = "force-dynamic";

// POST /api/orders/cancel/:id   body: { email }
// Customer cancels within 12h → auto Stripe refund + notifications.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    const body = (await req.json().catch(() => ({}))) as { email?: string };

    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    // authorise: email must match the order
    if (!body.email || body.email.trim().toLowerCase() !== order.customerEmail.toLowerCase()) {
      return NextResponse.json({ error: "Email does not match this order." }, { status: 403 });
    }

    if (!isCancellable(order.status, order.createdAt)) {
      return NextResponse.json(
        { error: "This order can no longer be cancelled online. Please contact us." },
        { status: 409 }
      );
    }

    // auto refund if we have a real Stripe payment
    let refunded = false;
    const stripe = getStripe();
    if (stripe && order.stripePaymentId && !order.stripePaymentId.startsWith("dev")) {
      try {
        await stripe.refunds.create({ payment_intent: order.stripePaymentId });
        refunded = true;
      } catch (err) {
        console.error("[cancel] refund failed", err);
        // proceed with cancellation; owner is alerted and can refund manually
      }
    } else if (order.stripePaymentId) {
      // dev / no-Stripe path — treat as refunded for the flow
      refunded = true;
    }

    const updated = await markCancelled(orderId, refunded);
    if (updated) await notifyCancelled(updated, refunded);

    return NextResponse.json({ order: updated, refunded });
  } catch (err) {
    console.error("[api/orders/cancel]", err);
    return NextResponse.json({ error: "Cancellation failed." }, { status: 500 });
  }
}
