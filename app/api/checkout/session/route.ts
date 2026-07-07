import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { toPence } from "@/lib/money";
import { earliestFulfilmentDate } from "@/lib/dates";
import { getStripe } from "@/lib/services/stripe";
import { isPostcodeDeliverable } from "@/lib/repos/store";
import {
  priceCheckout,
  computeDeliveryFee,
  createOrder,
  attachStripeSession,
  confirmOrderBySession,
} from "@/lib/repos/orders";
import { notifyOrderConfirmed } from "@/lib/services/notify";
import type { CheckoutRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequest;

    // ── validate customer ──
    if (!body.customer?.name?.trim()) return bad("Please enter your name.");
    if (!emailOk(body.customer?.email ?? "")) return bad("Please enter a valid email.");
    if (!body.customer?.phone?.trim()) return bad("Please enter a phone number.");

    // ── price + validate cart against DB ──
    const cart = await priceCheckout(body.items);

    // ── validate fulfilment ──
    const fulfilment = body.fulfilment === "delivery" ? "delivery" : "collection";
    let collectionSlotId: number | null = null;
    let deliveryAddress: string | null = null;
    let deliveryPostcode: string | null = null;

    if (!body.fulfilmentDate) return bad("Please choose a date.");
    const earliest = earliestFulfilmentDate(cart.longestLeadDays);
    if (body.fulfilmentDate < earliest) {
      return bad(`The earliest available date for this order is ${earliest}.`);
    }

    if (fulfilment === "collection") {
      if (!body.collectionSlotId) return bad("Please choose a collection time.");
      const slot = (await sql`
        SELECT id FROM collection_slots WHERE id = ${body.collectionSlotId} AND active = TRUE LIMIT 1
      `) as { id: number }[];
      if (!slot[0]) return bad("That collection slot is no longer available.");
      collectionSlotId = Number(slot[0].id);
    } else {
      deliveryAddress = body.deliveryAddress?.trim() || null;
      deliveryPostcode = body.deliveryPostcode?.trim() || null;
      if (!deliveryAddress) return bad("Please enter a delivery address.");
      if (!deliveryPostcode) return bad("Please enter a postcode.");
      if (!(await isPostcodeDeliverable(deliveryPostcode))) {
        return bad("Sorry — that postcode is outside our delivery area. Collection is still available.");
      }
    }

    const deliveryFee = await computeDeliveryFee(fulfilment, cart.subtotal);

    // ── create the pending order ──
    const { id, orderNumber, total } = await createOrder({
      type: fulfilment,
      customer: body.customer,
      cart,
      deliveryFee,
      collectionSlotId,
      fulfilmentDate: body.fulfilmentDate,
      deliveryAddress,
      deliveryPostcode,
      notes: body.orderNotes?.trim() || null,
      notifications: { email: body.notifications?.email ?? true, sms: body.notifications?.sms ?? false },
    });

    const stripe = getStripe();

    // ── DEV fallback: no Stripe keys → confirm immediately so the flow works ──
    if (!stripe) {
      const devSession = `dev_${orderNumber}`;
      await attachStripeSession(id, devSession);
      const { order, transitioned } = await confirmOrderBySession(devSession, "dev_payment");
      if (order && transitioned) await notifyOrderConfirmed(order);
      return NextResponse.json({
        url: `${SITE()}/checkout/success?order=${orderNumber}`,
        dev: true,
      });
    }

    // ── real Stripe hosted Checkout ──
    const lineItems: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: toPence(i.unitPrice),
        product_data: { name: i.name, ...(i.notes ? { description: i.notes } : {}) },
      },
    }));
    if (deliveryFee > 0) {
      lineItems.push({
        quantity: 1,
        price_data: { currency: "gbp", unit_amount: toPence(deliveryFee), product_data: { name: "Local delivery" } },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: body.customer.email,
      success_url: `${SITE()}/checkout/success?order=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE()}/cart?cancelled=1`,
      metadata: { orderId: String(id), orderNumber },
      payment_intent_data: { metadata: { orderId: String(id), orderNumber } },
    });

    await attachStripeSession(id, session.id);
    return NextResponse.json({ url: session.url, orderNumber, total });
  } catch (err) {
    console.error("[api/checkout/session]", err);
    return bad((err as Error).message || "Checkout failed.", 500);
  }
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
