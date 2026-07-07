"use client";
import { useState } from "react";
import { formatGBP } from "@/lib/money";
import type { Order } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  ready: "Ready for collection",
  collected: "Collected",
  dispatched: "Dispatched",
  cancelled: "Cancelled",
  refunded: "Cancelled & refunded",
};

export default function OrderLookupPage() {
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [cancellable, setCancellable] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCancelMsg("");
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/lookup?number=${encodeURIComponent(number)}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Not found.");
      } else {
        setOrder(data.order);
        setCancellable(data.cancellable);
      }
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    if (!order) return;
    if (!confirm("Cancel this order? If you've paid, a refund will be issued.")) return;
    setError("");
    const res = await fetch(`/api/orders/cancel/${order.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Cancellation failed.");
      return;
    }
    setOrder(data.order);
    setCancellable(false);
    setCancelMsg(data.refunded ? "Your order was cancelled and refunded." : "Your order was cancelled.");
  };

  return (
    <main className="pbfade wrap" style={{ padding: "56px 24px 90px", maxWidth: 720 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <span className="eyebrow">Your order</span>
        <h1 style={{ font: "500 clamp(32px,4.6vw,46px)/1.05 'Playfair Display',serif", color: "var(--ink)", margin: "10px 0 0" }}>Track or cancel an order</h1>
        <p style={{ font: "400 15px/1.7 Mulish", color: "#6c5a4a", margin: "12px auto 0", maxWidth: 480 }}>
          Enter your order number and the email you used. You can cancel free within 12 hours.
        </p>
      </div>

      <form onSubmit={lookup} className="card" style={{ padding: 28 }}>
        <div className="grid-2cols" style={{ gap: 14 }}>
          <div>
            <label className="field-label">Order number</label>
            <input className="field" placeholder="ORD-0084" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="field" placeholder="jane@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: 16, padding: 14, fontSize: 15, borderRadius: 14 }}>
          {loading ? "Looking…" : "Find my order"}
        </button>
        {error && <div className="field-error" style={{ marginTop: 12 }}>{error}</div>}
      </form>

      {order && (
        <div className="card" style={{ padding: 28, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <h2 style={{ font: "500 24px 'Playfair Display',serif", color: "var(--ink)", margin: 0 }}>{order.orderNumber}</h2>
            <span style={{ font: "600 12.5px Mulish", color: "var(--accent-deep)", background: "var(--blush-soft)", padding: "6px 12px", borderRadius: 999 }}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <p style={{ font: "500 14px Mulish", color: "var(--muted)", margin: "6px 0 16px" }}>
            {order.type === "delivery" ? "Delivery" : order.type === "contract" ? "Contract order" : "Collection"}
            {order.fulfilmentDate ? ` · ${order.fulfilmentDate}` : ""}
          </p>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            {order.items.map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", font: "500 14px Mulish", color: "#6c5a4a", padding: "6px 0" }}>
                <span>{i.quantity}× {i.nameSnapshot}{i.notes ? ` (${i.notes})` : ""}</span>
                <span>{formatGBP(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 12, font: "600 18px 'Playfair Display',serif", color: "var(--ink)" }}>
              <span>Total</span>
              <span>{formatGBP(order.total)}</span>
            </div>
          </div>

          {cancelMsg && (
            <div style={{ marginTop: 16, background: "var(--blush-soft)", color: "var(--accent-deep)", borderRadius: 12, padding: "12px 16px", font: "600 14px Mulish" }}>
              {cancelMsg}
            </div>
          )}
          {cancellable && (
            <button onClick={cancel} className="btn btn-outline" style={{ marginTop: 18, padding: "12px 22px", fontSize: 14, borderColor: "var(--danger)", color: "var(--danger)" }}>
              Cancel this order
            </button>
          )}
        </div>
      )}
    </main>
  );
}
