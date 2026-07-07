// ─────────────────────────────────────────────────────────────
// Notification orchestration. One place that decides who gets what
// on each order event, sends via Resend/Twilio, and logs every
// attempt to order_notifications.
//
// Rules:
//  • confirmed  → customer email (always) + SMS (if opted) + owner SMS
//  • ready/dispatched → customer email + SMS (per preference)
//  • cancelled  → customer email + SMS (per pref) + owner SMS
// All customer emails use a per-order Reply-To for threading.
// ─────────────────────────────────────────────────────────────
import { sql } from "@/lib/db";
import { formatGBP } from "@/lib/money";
import { sendEmail, replyToForOrder } from "@/lib/services/email";
import { sendSms, ownerSmsNumber } from "@/lib/services/sms";
import type { NotificationChannel, NotificationEvent, Order } from "@/lib/types";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function log(
  orderId: number,
  channel: NotificationChannel,
  event: NotificationEvent,
  recipient: string,
  result: { ok: boolean; id: string | null; skipped: boolean; error?: string }
) {
  const status = result.skipped ? "skipped" : result.ok ? "sent" : "failed";
  await sql`
    INSERT INTO order_notifications (order_id, channel, event, recipient, status, provider_id, detail)
    VALUES (${orderId}, ${channel}, ${event}, ${recipient}, ${status}, ${result.id}, ${result.error ?? null})
  `;
}

function itemsHtml(order: Order): string {
  return order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;">${i.quantity}× ${i.nameSnapshot}${
          i.notes ? ` <em style="color:#9c6f43;">(${i.notes})</em>` : ""
        }</td><td style="padding:6px 0;text-align:right;">${formatGBP(i.unitPrice * i.quantity)}</td></tr>`
    )
    .join("");
}

function fulfilmentLine(order: Order): string {
  if (order.type === "delivery") {
    return `Delivery${order.fulfilmentDate ? ` on ${order.fulfilmentDate}` : ""}${
      order.deliveryAddress ? ` to ${order.deliveryAddress}` : ""
    }`;
  }
  if (order.type === "contract") return "Contract / invoice order";
  return `Collection${order.fulfilmentDate ? ` on ${order.fulfilmentDate}` : ""}`;
}

function emailShell(order: Order, heading: string, intro: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#473529;">
    <h1 style="font-size:22px;color:#473529;">Open Door Bakery</h1>
    <h2 style="font-size:18px;color:#9c6f43;">${heading}</h2>
    <p style="font-size:14px;line-height:1.6;">${intro}</p>
    <p style="font-size:14px;"><b>Order ${order.orderNumber}</b><br>${fulfilmentLine(order)}</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      ${itemsHtml(order)}
      <tr><td style="padding:8px 0;border-top:1px solid #e8dcc9;">Subtotal</td><td style="padding:8px 0;border-top:1px solid #e8dcc9;text-align:right;">${formatGBP(order.subtotal)}</td></tr>
      ${order.deliveryFee > 0 ? `<tr><td>Delivery</td><td style="text-align:right;">${formatGBP(order.deliveryFee)}</td></tr>` : ""}
      <tr><td style="padding:6px 0;font-weight:bold;">Total</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${formatGBP(order.total)}</td></tr>
    </table>
    <p style="font-size:12px;color:#9c8a78;margin-top:20px;">Reply to this email and it'll reach us about this order. Open Door Bakery, Harrogate.</p>
  </div>`;
}

/** confirmed → customer email (always) + SMS (if opted) + owner SMS */
export async function notifyOrderConfirmed(order: Order) {
  const replyTo = replyToForOrder(order.orderNumber);

  const email = await sendEmail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} confirmed — Open Door Bakery`,
    html: emailShell(order, "Thank you — your order is confirmed", "We've received your order and we're on it. Here's your confirmation:"),
    replyTo,
  });
  await log(order.id, "email", "confirmed", order.customerEmail, email);

  if (order.prefs?.smsOptIn && order.customerPhone) {
    const sms = await sendSms(
      order.customerPhone,
      `Open Door Bakery: order ${order.orderNumber} confirmed — total ${formatGBP(order.total)}. ${fulfilmentLine(order)}.`
    );
    await log(order.id, "sms", "confirmed", order.customerPhone, sms);
  }

  const owner = ownerSmsNumber();
  if (owner) {
    const sms = await sendSms(
      owner,
      `New order ${order.orderNumber} (${order.type}) — ${formatGBP(order.total)}. ${fulfilmentLine(order)}. ${SITE()}/dashboard`
    );
    await log(order.id, "sms", "owner_alert", owner, sms);
  }
}

/** ready / dispatched → customer email + SMS (per preference) */
export async function notifyStatusChange(order: Order, event: "ready" | "dispatched") {
  const isDispatch = event === "dispatched";
  const heading = isDispatch ? "Your order is on its way" : "Your order is ready";
  const intro = isDispatch
    ? "Your box has been dispatched and will arrive within your delivery window."
    : "Your box is baked, boxed and ready for collection at your chosen time.";

  const email = await sendEmail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} — ${heading}`,
    html: emailShell(order, heading, intro),
    replyTo: replyToForOrder(order.orderNumber),
  });
  await log(order.id, "email", event, order.customerEmail, email);

  if (order.prefs?.smsOptIn && order.customerPhone) {
    const sms = await sendSms(
      order.customerPhone,
      `Open Door Bakery: order ${order.orderNumber} — ${heading.toLowerCase()}.`
    );
    await log(order.id, "sms", event, order.customerPhone, sms);
  }
}

/** cancelled → customer email + SMS (per pref) + owner SMS */
export async function notifyCancelled(order: Order, refunded: boolean) {
  const intro = refunded
    ? "Your order has been cancelled and a full refund is on its way back to your card (allow 5–10 days)."
    : "Your order has been cancelled.";

  const email = await sendEmail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} cancelled`,
    html: emailShell(order, "Order cancelled", intro),
    replyTo: replyToForOrder(order.orderNumber),
  });
  await log(order.id, "email", "cancelled", order.customerEmail, email);

  if (order.prefs?.smsOptIn && order.customerPhone) {
    const sms = await sendSms(
      order.customerPhone,
      `Open Door Bakery: order ${order.orderNumber} cancelled${refunded ? " and refunded" : ""}.`
    );
    await log(order.id, "sms", "cancelled", order.customerPhone, sms);
  }

  const owner = ownerSmsNumber();
  if (owner) {
    const sms = await sendSms(owner, `Order ${order.orderNumber} cancelled by customer${refunded ? " (refunded)" : ""}.`);
    await log(order.id, "sms", "owner_alert", owner, sms);
  }
}
