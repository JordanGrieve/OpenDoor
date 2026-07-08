import Link from "next/link";
import { getStripe } from "@/lib/services/stripe";
import { confirmOrderBySession } from "@/lib/repos/orders";
import { notifyOrderConfirmed } from "@/lib/services/notify";

export const dynamic = "force-dynamic";

// Confirm-on-return: the webhook is the primary path, but retrieving the
// Checkout Session here means payment is confirmed even without a webhook
// configured (e.g. local dev). Idempotent — notifications fire once.
async function confirmFromSession(sessionId: string) {
  const stripe = getStripe();
  if (!stripe) return;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid" || session.status === "complete") {
      const paymentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
      const { order, transitioned } = await confirmOrderBySession(session.id, paymentId);
      if (order && transitioned) await notifyOrderConfirmed(order);
    }
  } catch (err) {
    console.error("[checkout/success] confirm failed", err);
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; session_id?: string }>;
}) {
  const { order, session_id } = await searchParams;
  if (session_id) await confirmFromSession(session_id);

  return (
    <main className="pbfade wrap" style={{ padding: "80px 24px 100px", maxWidth: 640 }}>
      <div className="card" style={{ padding: 54, textAlign: "center", borderRadius: 26 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--blush-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto" }}>
          🥐
        </div>
        <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: "20px 0 0" }}>Order placed — thank you!</h1>
        {order && (
          <p style={{ font: "600 15px Mulish", color: "var(--accent-deep)", margin: "10px 0 0" }}>Your order number is {order}</p>
        )}
        <p style={{ font: "400 16px/1.7 Mulish", color: "#6c5a4a", margin: "12px 0 0" }}>
          We&apos;ve sent a confirmation to your email. You can track or cancel your order anytime — cancellations are free
          within 12 hours.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
          <Link href="/orders" className="btn btn-outline" style={{ padding: "13px 24px", fontSize: 14 }}>Track / cancel order</Link>
          <Link href="/shop" className="btn btn-primary" style={{ padding: "13px 26px", fontSize: 14 }}>Back to the shop</Link>
        </div>
      </div>
    </main>
  );
}
