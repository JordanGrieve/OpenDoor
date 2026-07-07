"use client";
// Placeholder checkout entry — the full collection/delivery flow,
// date + slot picker, notification opt-in and Stripe hosted session
// land in the next build step (POST /api/checkout/session).
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { formatGBP } from "@/lib/money";

export default function CheckoutPage() {
  const { items, subtotal, ready } = useCart();
  if (!ready) return <main style={{ minHeight: "60vh" }} />;

  return (
    <main className="pbfade wrap" style={{ padding: "56px 24px 90px", maxWidth: 720 }}>
      <h1 style={{ font: "500 clamp(32px,4.4vw,44px)/1 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 8px" }}>
        Checkout
      </h1>
      <p style={{ font: "400 15px/1.7 Mulish", color: "#6c5a4a", marginBottom: 24 }}>
        You have {items.length} line{items.length === 1 ? "" : "s"} · subtotal {formatGBP(subtotal)}.
      </p>
      <div className="card" style={{ padding: 28 }}>
        <p style={{ font: "400 15px/1.7 Mulish", color: "#6c5a4a", margin: 0 }}>
          Secure Stripe payment is being connected. The collection/delivery details, date &amp; time-slot picker and
          notification preferences will appear here — then you&apos;ll be handed to Stripe&apos;s hosted checkout to pay.
        </p>
        <Link href="/cart" style={{ display: "inline-block", marginTop: 18, font: "600 14px Mulish", color: "var(--accent-deep)" }}>
          ← Back to your box
        </Link>
      </div>
    </main>
  );
}
