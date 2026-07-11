"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import { formatGBP } from "@/lib/money";
import { tileBackground } from "@/lib/theme";
import type { DeliverySettings } from "@/lib/types";

export default function CartPage() {
  const { items, subtotal, setQty, remove, hasCelebration, ready } = useCart();
  const router = useRouter();
  const [fulfilment, setFulfilment] = useState<"collection" | "delivery">("collection");
  const [settings, setSettings] = useState<DeliverySettings | null>(null);

  useEffect(() => {
    fetch("/api/settings/delivery")
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .catch(() => setSettings({ deliveryFee: 4.5, freeDeliveryMin: 40, originPostcode: "ML3 7PD", radiusMiles: 8 }));
  }, []);

  const freeMin = settings?.freeDeliveryMin ?? 40;
  const baseFee = settings?.deliveryFee ?? 4.5;
  const deliveryFee = fulfilment === "delivery" ? (subtotal >= freeMin ? 0 : baseFee) : 0;
  const total = subtotal + deliveryFee;
  const remaining = Math.max(0, freeMin - subtotal);

  if (!ready) return <main style={{ minHeight: "60vh" }} />;

  return (
    <main className="pbfade wrap" style={{ padding: "56px 24px 90px", maxWidth: 1080 }}>
      <h1 style={{ font: "500 clamp(34px,4.6vw,48px)/1 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 30px" }}>
        Your box
      </h1>

      {items.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center", borderRadius: 26 }}>
          <div style={{ fontSize: 38 }}>🧁</div>
          <h2 style={{ font: "500 26px 'Playfair Display',serif", color: "var(--ink)", margin: "14px 0 0" }}>Your box is empty</h2>
          <p style={{ font: "400 15.5px/1.6 Mulish", color: "#6c5a4a", margin: "8px auto 0", maxWidth: 360 }}>
            Let&apos;s fix that — the croissants are still warm.
          </p>
          <Link href="/shop" className="btn btn-primary" style={{ display: "inline-block", marginTop: 22, padding: "14px 28px", fontSize: 15 }}>
            Start shopping →
          </Link>
        </div>
      ) : (
        <div className="cart-grid">
          {/* items */}
          <div>
            <div className="card" style={{ padding: "8px 24px" }}>
              {items.map((i) => (
                <div
                  key={`${i.variantId}-${i.notes ?? ""}`}
                  className="cart-item"
                  style={{ padding: "20px 0", borderBottom: "1px solid var(--line)" }}
                >
                  <div className="sheen" style={{ width: 84, height: 84, borderRadius: 16, background: tileBackground(i.imageUrl, "Other"), flexShrink: 0, position: "relative", overflow: "hidden" }} />
                  <div className="cart-item-main" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "600 17px 'Playfair Display',serif", color: "var(--ink)" }}>
                      {i.name}
                      {i.variantLabel ? ` · ${i.variantLabel}` : ""}
                    </div>
                    <div style={{ font: "500 13px Mulish", color: "var(--muted)", marginTop: 2 }}>{formatGBP(i.price)} each</div>
                    {i.notes && (
                      <div style={{ font: "400 12.5px/1.4 Mulish", color: "var(--accent-deep)", background: "var(--blush-soft)", padding: "6px 10px", borderRadius: 10, marginTop: 8 }}>
                        ✎ {i.notes}
                      </div>
                    )}
                  </div>
                  <div className="cart-item-controls">
                    <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--line)", borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
                      <button onClick={() => setQty(i.variantId, i.notes, i.quantity - 1)} className="btn" style={{ width: 36, height: 36, fontSize: 17, color: "var(--ink)", background: "none" }}>−</button>
                      <span style={{ minWidth: 30, textAlign: "center", font: "600 15px Mulish", color: "var(--ink)" }}>{i.quantity}</span>
                      <button onClick={() => setQty(i.variantId, i.notes, i.quantity + 1)} className="btn" style={{ width: 36, height: 36, fontSize: 17, color: "var(--ink)", background: "none" }}>+</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ minWidth: 64, textAlign: "right", font: "600 17px 'Playfair Display',serif", color: "var(--ink)" }}>
                        {formatGBP(i.price * i.quantity)}
                      </div>
                      <button onClick={() => remove(i.variantId, i.notes)} aria-label="Remove" className="btn" style={{ color: "var(--muted)", fontSize: 18, background: "none", flexShrink: 0 }}>×</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* summary */}
          <div className="card" style={{ padding: 28, position: "sticky", top: 90 }}>
            <h2 style={{ font: "500 22px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 18px" }}>Summary</h2>

            <div style={{ font: "600 12px Mulish", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>
              How would you like it?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <FulfilmentBtn active={fulfilment === "collection"} onClick={() => setFulfilment("collection")} label="🏡 Collection" hint="Free" />
              <FulfilmentBtn active={fulfilment === "delivery"} onClick={() => setFulfilment("delivery")} label="🚲 Local delivery" hint={deliveryFee === 0 ? "Free" : formatGBP(baseFee)} />
            </div>

            <Row label="Subtotal" value={formatGBP(subtotal)} />
            <Row label={fulfilment === "delivery" ? "Delivery" : "Collection"} value={deliveryFee === 0 ? "Free" : formatGBP(deliveryFee)} />
            {fulfilment === "delivery" && subtotal < freeMin && (
              <div style={{ font: "500 12.5px Mulish", color: "var(--accent-deep)", background: "var(--blush-soft)", padding: "8px 12px", borderRadius: 10, margin: "6px 0" }}>
                Add {formatGBP(remaining)} more for free delivery.
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 14, font: "600 20px 'Playfair Display',serif", color: "var(--ink)" }}>
              <span>Total</span>
              <span>{formatGBP(total)}</span>
            </div>

            <button
              onClick={() => router.push(`/checkout?fulfilment=${fulfilment}`)}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 20, padding: 16, fontSize: 16, borderRadius: 14 }}
            >
              Checkout →
            </button>

            {hasCelebration && (
              <p style={{ font: "400 12.5px/1.6 Mulish", color: "var(--muted)", margin: "14px 0 0", textAlign: "center" }}>
                💛 Your box includes a made-to-order item — after you order, we&apos;ll be in touch to confirm the details (flavour, message on the cake).
              </p>
            )}
            <p style={{ font: "400 12px/1.6 Mulish", color: "var(--muted)", margin: "12px 0 0", textAlign: "center" }}>
              Secure Stripe checkout · your card details never touch our servers.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", font: "500 14.5px Mulish", color: "#6c5a4a", padding: "7px 0" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function FulfilmentBtn({ active, onClick, label, hint }: { active: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      onClick={onClick}
      className="btn"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        border: `1.5px solid ${active ? "var(--accent)" : "var(--line)"}`,
        background: active ? "var(--blush-soft)" : "var(--card)",
        borderRadius: 14,
        font: "600 14px Mulish",
        color: "var(--ink)",
        textAlign: "left",
      }}
    >
      {label}
      <span style={{ font: "600 12.5px Mulish", color: "var(--accent-deep)" }}>{hint}</span>
    </button>
  );
}
