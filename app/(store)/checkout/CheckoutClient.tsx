"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import { formatGBP } from "@/lib/money";
import { fulfilmentDateOptions, prettyDate } from "@/lib/dates";
import type { CollectionSlot, DeliverySettings } from "@/lib/types";

export default function CheckoutClient() {
  const { items, subtotal, longestLeadTime, hasCelebration, clear, ready } = useCart();
  const params = useSearchParams();

  const [fulfilment, setFulfilment] = useState<"collection" | "delivery">(
    params.get("fulfilment") === "delivery" ? "delivery" : "collection"
  );
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [slots, setSlots] = useState<CollectionSlot[]>([]);

  const dateOptions = useMemo(() => fulfilmentDateOptions(longestLeadTime, 14), [longestLeadTime]);
  const [date, setDate] = useState("");
  const [slotId, setSlotId] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [notify, setNotify] = useState({ email: true, sms: false });
  const [orderNotes, setOrderNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/settings/delivery").then((r) => r.json()).then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (dateOptions.length && !date) setDate(dateOptions[0]);
  }, [dateOptions, date]);

  useEffect(() => {
    if (fulfilment !== "collection" || !date) return;
    fetch(`/api/slots?date=${date}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]));
  }, [fulfilment, date]);

  const freeMin = settings?.freeDeliveryMin ?? 40;
  const baseFee = settings?.deliveryFee ?? 4.5;
  const deliveryFee = fulfilment === "delivery" ? (subtotal >= freeMin ? 0 : baseFee) : 0;
  const total = subtotal + deliveryFee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfilment,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            notes: i.notes,
          })),
          customer,
          collectionSlotId: fulfilment === "collection" ? slotId : null,
          fulfilmentDate: date,
          deliveryAddress: fulfilment === "delivery" ? address : null,
          deliveryPostcode: fulfilment === "delivery" ? postcode : null,
          notifications: notify,
          orderNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Checkout failed.");
        setSubmitting(false);
        return;
      }
      // Order created; hand off to Stripe (or the dev success page).
      clear();
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (!ready) return <main style={{ minHeight: "60vh" }} />;

  if (items.length === 0) {
    return (
      <main className="pbfade wrap" style={{ padding: "80px 24px", maxWidth: 620, textAlign: "center" }}>
        <h1 style={{ font: "500 32px 'Playfair Display',serif", color: "var(--ink)" }}>Your box is empty</h1>
        <Link href="/shop" className="btn btn-primary" style={{ display: "inline-block", marginTop: 18, padding: "13px 26px", fontSize: 15 }}>
          Start shopping →
        </Link>
      </main>
    );
  }

  return (
    <main className="pbfade wrap" style={{ padding: "48px 24px 90px", maxWidth: 1040 }}>
      <h1 style={{ font: "500 clamp(32px,4.4vw,44px)/1 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 8px" }}>
        Checkout
      </h1>
      <p style={{ font: "400 15px/1.6 Mulish", color: "#6c5a4a", marginBottom: 28 }}>
        Almost there — a few details and we&apos;ll hand you to secure payment.
      </p>

      <form onSubmit={submit} className="grid-2cols" style={{ gridTemplateColumns: "1.4fr .9fr", gap: 28, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* fulfilment */}
          <section className="card" style={{ padding: 24 }}>
            <h2 style={sectionTitle}>How would you like it?</h2>
            <div style={{ display: "flex", gap: 12 }}>
              <Choice active={fulfilment === "collection"} onClick={() => setFulfilment("collection")} label="🏡 Collection" hint="Free" />
              <Choice active={fulfilment === "delivery"} onClick={() => setFulfilment("delivery")} label="🚲 Local delivery" hint={deliveryFee === 0 ? "Free" : formatGBP(baseFee)} />
            </div>
          </section>

          {/* date + slot / address */}
          <section className="card" style={{ padding: 24 }}>
            <h2 style={sectionTitle}>{fulfilment === "collection" ? "When to collect" : "When to deliver"}</h2>
            <label className="field-label">Date{longestLeadTime > 0 ? ` (earliest reflects a ${longestLeadTime}-day lead time)` : ""}</label>
            <select className="field" value={date} onChange={(e) => setDate(e.target.value)}>
              {dateOptions.map((d) => (
                <option key={d} value={d}>{prettyDate(d)}</option>
              ))}
            </select>

            {fulfilment === "collection" ? (
              <div style={{ marginTop: 16 }}>
                <label className="field-label">Collection time</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {slots.map((s) => {
                    const on = slotId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSlotId(s.id)}
                        className="btn"
                        style={{
                          border: `1.5px solid ${on ? "var(--accent)" : "var(--line)"}`,
                          background: on ? "var(--blush-soft)" : "var(--card)",
                          color: "var(--ink)",
                          padding: "10px 14px",
                          borderRadius: 12,
                          font: "600 13px Mulish",
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                  {slots.length === 0 && <span style={{ font: "500 13px Mulish", color: "var(--muted)" }}>No slots for this date.</span>}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label className="field-label">Delivery address</label>
                  <textarea className="field" rows={3} placeholder="12 Cadzow Street, Hamilton" value={address} onChange={(e) => setAddress(e.target.value)} style={{ resize: "vertical" }} />
                </div>
                <div>
                  <label className="field-label">Postcode</label>
                  <input className="field" placeholder="ML3 7PD" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
                  {settings && (
                    <p style={{ font: "400 12px Mulish", color: "var(--muted)", marginTop: 6 }}>
                      We deliver within {settings.radiusMiles} miles of {settings.originPostcode}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* contact */}
          <section className="card" style={{ padding: 24 }}>
            <h2 style={sectionTitle}>Your details</h2>
            <div className="grid-2cols" style={{ gap: 14 }}>
              <div>
                <label className="field-label">Name</label>
                <input className="field" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Jane Baker" />
              </div>
              <div>
                <label className="field-label">Phone</label>
                <input className="field" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="07000 000000" />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="field-label">Email</label>
              <input className="field" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="jane@email.com" />
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="field-label">Order notes (optional)</label>
              <textarea className="field" rows={2} value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="A message for a gift box, dietary notes…" style={{ resize: "vertical" }} />
            </div>
          </section>

          {/* notifications */}
          <section className="card" style={{ padding: 24 }}>
            <h2 style={sectionTitle}>Keep me posted</h2>
            <label style={checkRow}>
              <input type="checkbox" checked={notify.email} onChange={(e) => setNotify({ ...notify, email: e.target.checked })} />
              Email me order updates
            </label>
            <label style={checkRow}>
              <input type="checkbox" checked={notify.sms} onChange={(e) => setNotify({ ...notify, sms: e.target.checked })} />
              Text me order updates (SMS)
            </label>
          </section>
        </div>

        {/* summary */}
        <div className="card" style={{ padding: 26, position: "sticky", top: 90 }}>
          <h2 style={{ font: "500 22px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 16px" }}>Order summary</h2>
          {items.map((i) => (
            <div key={`${i.variantId}-${i.notes ?? ""}`} style={{ display: "flex", justifyContent: "space-between", font: "500 14px Mulish", color: "#6c5a4a", padding: "6px 0" }}>
              <span>{i.quantity}× {i.name}{i.variantLabel ? ` · ${i.variantLabel}` : ""}</span>
              <span>{formatGBP(i.price * i.quantity)}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 10, paddingTop: 12 }}>
            <Row label="Subtotal" value={formatGBP(subtotal)} />
            <Row label={fulfilment === "delivery" ? "Delivery" : "Collection"} value={deliveryFee === 0 ? "Free" : formatGBP(deliveryFee)} />
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 12, font: "600 20px 'Playfair Display',serif", color: "var(--ink)" }}>
              <span>Total</span>
              <span>{formatGBP(total)}</span>
            </div>
          </div>

          {hasCelebration && (
            <p style={{ font: "400 12.5px/1.6 Mulish", color: "var(--muted)", margin: "12px 0 0" }}>
              💛 Your box includes a celebration item — we&apos;ll confirm the details before your event.
            </p>
          )}
          {error && <div className="field-error" style={{ marginTop: 12 }}>{error}</div>}

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: "100%", marginTop: 16, padding: 16, fontSize: 16, borderRadius: 14, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Taking you to payment…" : `Pay ${formatGBP(total)} →`}
          </button>
          <p style={{ font: "400 12px/1.6 Mulish", color: "var(--muted)", margin: "12px 0 0", textAlign: "center" }}>
            Secure Stripe checkout · your card details never touch our servers.
          </p>
        </div>
      </form>
    </main>
  );
}

const sectionTitle: React.CSSProperties = { font: "500 18px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 14px" };
const checkRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, font: "500 14.5px Mulish", color: "var(--ink)", padding: "6px 0", cursor: "pointer" };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", font: "500 14.5px Mulish", color: "#6c5a4a", padding: "6px 0" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Choice({ active, onClick, label, hint }: { active: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn"
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        border: `1.5px solid ${active ? "var(--accent)" : "var(--line)"}`,
        background: active ? "var(--blush-soft)" : "var(--card)",
        borderRadius: 14,
        font: "600 14px Mulish",
        color: "var(--ink)",
      }}
    >
      {label}
      <span style={{ font: "600 12.5px Mulish", color: "var(--accent-deep)" }}>{hint}</span>
    </button>
  );
}
