"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatGBP } from "@/lib/money";

interface Line {
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function B2BOrderPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [fulfilmentDate, setFulfilmentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ name: "", quantity: 1, unitPrice: 0 }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const total = lines.reduce((t, l) => t + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0), 0);

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, { name: "", quantity: 1, unitPrice: 0 }]);
  const removeLine = (i: number) => setLines((ls) => ls.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!customer.name.trim()) return setError("Business / customer name is required.");
    const items = lines.filter((l) => l.name.trim() && l.quantity > 0);
    if (!items.length) return setError("Add at least one line item.");
    setSaving(true);
    const res = await fetch("/api/admin/orders/b2b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer, fulfilmentDate: fulfilmentDate || null, notes, items }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || "Failed to create order.");
    router.push(`/dashboard/orders/${data.id}`);
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 6px" }}>Log a B2B / contract order</h1>
      <p style={{ font: "400 14px Mulish", color: "#6c5a4a", marginBottom: 22 }}>
        Invoice order — no card payment taken. It joins the queue tagged as a contract.
      </p>

      <form onSubmit={submit} className="card" style={{ padding: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Business / customer">
            <input className="field" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Bettys Tea Room" />
          </Field>
          <Field label="Email">
            <input className="field" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="orders@…" />
          </Field>
          <Field label="Phone">
            <input className="field" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
          </Field>
          <Field label="Fulfilment date">
            <input className="field" type="date" value={fulfilmentDate} onChange={(e) => setFulfilmentDate(e.target.value)} />
          </Field>
        </div>

        <div style={{ marginTop: 20 }}>
          <label className="field-label">Line items</label>
          {lines.map((l, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px 32px", gap: 8, marginBottom: 8 }}>
              <input className="field" placeholder="e.g. Croissants (wholesale)" value={l.name} onChange={(e) => setLine(i, { name: e.target.value })} />
              <input className="field" type="number" min={1} value={l.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })} />
              <input className="field" type="number" min={0} step="0.01" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) })} placeholder="£ each" />
              <button type="button" onClick={() => removeLine(i)} className="btn" style={{ background: "none", color: "var(--muted)", fontSize: 18 }}>×</button>
            </div>
          ))}
          <button type="button" onClick={addLine} className="btn" style={{ background: "var(--card)", border: "1.5px solid var(--line)", borderRadius: 999, padding: "8px 14px", font: "600 13px Mulish", color: "var(--ink)" }}>
            + Add line
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <label className="field-label">Notes</label>
          <textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <div style={{ font: "600 20px 'Playfair Display',serif", color: "var(--ink)" }}>Total {formatGBP(total)}</div>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: "12px 24px", fontSize: 15, borderRadius: 14 }}>
            {saving ? "Saving…" : "Create order"}
          </button>
        </div>
        {error && <div className="field-error" style={{ marginTop: 12 }}>{error}</div>}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
