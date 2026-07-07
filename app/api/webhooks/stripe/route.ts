import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, webhookSecret } from "@/lib/services/stripe";
import { confirmOrderBySession } from "@/lib/repos/orders";
import { notifyOrderConfirmed } from "@/lib/services/notify";

export const dynamic = "force-dynamic";

// POST /api/webhooks/stripe
// On payment success: confirm the order, decrement stock, and send
// confirmation email + SMS (customer, if opted) + owner SMS.
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = webhookSecret();
  if (!stripe || !secret) {
    console.warn("[webhook] Stripe not configured — ignoring event.");
    return NextResponse.json({ received: true, ignored: true });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid" || session.status === "complete") {
        const paymentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;
        const { order, transitioned } = await confirmOrderBySession(session.id, paymentId);
        // notify only on the call that actually confirmed the order
        if (order && transitioned) {
          await notifyOrderConfirmed(order);
        }
      }
    }
  } catch (err) {
    console.error("[webhook] handler error", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
