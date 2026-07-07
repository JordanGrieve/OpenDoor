"use client";
import Link from "next/link";
import { useState } from "react";

const ASSURANCES = [
  { icon: "🎂", text: "Reply within 24 hours" },
  { icon: "🌱", text: "Dietary needs welcome" },
  { icon: "💛", text: "No deposit to enquire" },
];

export default function CustomPage() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", date: "", type: "Celebration cake", people: "", fulfilment: "Collection", message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!form.name.trim()) er.name = "Please tell us your name";
    if (!emailOk(form.email)) er.email = "Enter a valid email address";
    if (!form.date) er.date = "Choose a date";
    if (!form.message.trim()) er.message = "A few details help us help you";
    setErrors(er);
    if (Object.keys(er).length) return;
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "custom", ...form }),
    });
    setDone(true);
    window.scrollTo({ top: 0 });
  };

  return (
    <main className="pbfade wrap" style={{ padding: "56px 24px 90px", maxWidth: 1080 }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <span className="eyebrow">Something special</span>
        <h1 style={{ font: "500 clamp(36px,5vw,52px)/1.05 'Playfair Display',serif", color: "var(--ink)", margin: "10px 0 0" }}>Custom orders</h1>
        <p style={{ font: "400 16.5px/1.7 Mulish", color: "#6c5a4a", margin: "14px auto 0", maxWidth: 600 }}>
          Celebration cakes, generous pastry boxes, event orders, dessert tables — tell us what you have in mind and Emma
          will reply personally within 24 hours.
        </p>
      </div>

      <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", margin: "30px 0 40px" }}>
        {ASSURANCES.map((a) => (
          <div key={a.text} className="card" style={{ display: "flex", alignItems: "center", gap: 9, borderRadius: 999, padding: "10px 18px" }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <span style={{ font: "600 13.5px Mulish", color: "var(--ink)" }}>{a.text}</span>
          </div>
        ))}
      </div>

      {done ? (
        <div className="card" style={{ maxWidth: 620, margin: "0 auto", borderRadius: 26, padding: 48, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--blush-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto" }}>🎂</div>
          <h2 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: "20px 0 0" }}>Enquiry sent — thank you!</h2>
          <p style={{ font: "400 16px/1.7 Mulish", color: "#6c5a4a", margin: "12px 0 0" }}>
            Emma has your details and will be in touch within 24 hours. Keep an eye on your inbox.
          </p>
          <Link href="/shop" className="btn btn-primary" style={{ display: "inline-block", marginTop: 24, padding: "13px 26px", fontSize: 14 }}>
            Browse the shop meanwhile →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="card" style={{ maxWidth: 780, margin: "0 auto", borderRadius: 28, padding: 40, boxShadow: "0 30px 60px -40px rgba(120,80,40,.4)" }}>
          <div className="grid-2cols" style={{ gap: 20 }}>
            <Field label="Your name" error={errors.name}>
              <input className="field" placeholder="Jane Baker" value={form.name} onChange={upd("name")} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="field" placeholder="jane@email.com" value={form.email} onChange={upd("email")} />
            </Field>
            <Field label="Phone number">
              <input className="field" placeholder="07000 000000" value={form.phone} onChange={upd("phone")} />
            </Field>
            <Field label="Date required" error={errors.date}>
              <input className="field" type="date" value={form.date} onChange={upd("date")} />
            </Field>
            <Field label="Type of order">
              <select className="field" value={form.type} onChange={upd("type")}>
                <option>Celebration cake</option><option>Pastry box</option><option>Event order</option>
                <option>Birthday box</option><option>Dessert table</option><option>Other / not sure yet</option>
              </select>
            </Field>
            <Field label="Number of people">
              <input className="field" type="number" min={1} placeholder="e.g. 12" value={form.people} onChange={upd("people")} />
            </Field>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="field-label">Collection or local delivery</label>
            <div style={{ display: "flex", gap: 12 }}>
              {(["Collection", "Local delivery"] as const).map((opt) => {
                const on = form.fulfilment === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, fulfilment: opt }))}
                    className="btn"
                    style={{ flex: 1, padding: 14, border: `1.5px solid ${on ? "var(--accent)" : "var(--line)"}`, background: on ? "var(--blush-soft)" : "var(--card)", color: "var(--ink)", borderRadius: 14, font: "600 14px Mulish" }}
                  >
                    {opt === "Collection" ? "🏡 " : "🚲 "}{opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="field-label">Message / details</label>
            <textarea className="field" rows={5} placeholder="Tell us about the occasion, flavours, colours, dietary needs, inspiration — anything goes." value={form.message} onChange={upd("message")} style={{ resize: "vertical" }} />
            {errors.message && <div className="field-error">{errors.message}</div>}
          </div>

          <p style={{ font: "400 13px/1.6 Mulish", color: "var(--muted)", margin: "18px 0 0" }}>
            Custom orders need at least 5 days&apos; notice (larger events, 2 weeks). Nothing is charged until you&apos;ve confirmed the details with Emma.
          </p>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 18, padding: 16, fontSize: 16, borderRadius: 14 }}>
            Send enquiry
          </button>
        </form>
      )}
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
