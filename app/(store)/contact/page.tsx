"use client";
import { useState } from "react";
import Turnstile from "@/components/store/Turnstile";

const FAQS = [
  { q: "How does local delivery work?", a: "We deliver within about 8 miles of Hamilton — including Motherwell, Wishaw, Bellshill, Bothwell, Blantyre, Larkhall, Coatbridge and East Kilbride. Order before 4pm for next-day delivery, with a one-hour arrival window. Delivery is free over £40, otherwise £4.50." },
  { q: "Where and when can I collect?", a: "Collect from our kitchen in Hamilton (ML3), Tuesday to Sunday. We'll confirm the exact address and have your box ready at your chosen time." },
  { q: "Can you cater for allergies?", a: "Yes — most bakes can be adapted and we offer gluten-free options on selected items. Everything is made in a small kitchen that handles gluten, dairy, egg and nuts, so we can't guarantee zero traces. Just ask." },
  { q: "How do custom orders work?", a: "Send an enquiry with your date, numbers and ideas. Emma replies personally, you confirm the details, and only then do we take payment." },
  { q: "How much notice do you need?", a: "At least 5 days for celebration cakes and boxes, and around 2 weeks for larger event orders. For everyday items, order by 4pm for next day." },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [token, setToken] = useState("");

  const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!form.name.trim()) er.name = "Please tell us your name";
    if (!emailOk(form.email)) er.email = "Enter a valid email address";
    if (!form.message.trim()) er.message = "Type your message";
    setErrors(er);
    if (Object.keys(er).length) return;

    setSending(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "contact", ...form, turnstileToken: token }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || "Something went wrong. Please try again.");
        setSending(false);
      }
    } catch {
      setSubmitError("Couldn't send — please check your connection and try again.");
      setSending(false);
    }
  };

  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <main className="pbfade wrap" style={{ padding: "56px 24px 90px", maxWidth: 1100 }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span className="eyebrow">Say hello</span>
        <h1 style={{ font: "500 clamp(36px,5vw,52px)/1.05 'Playfair Display',serif", color: "var(--ink)", margin: "10px 0 0" }}>Get in touch</h1>
        <p style={{ font: "400 16px/1.7 Mulish", color: "#6c5a4a", margin: "12px auto 0", maxWidth: 520 }}>
          Questions about an order, allergens or a special request? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="contact-grid" style={{ gap: 30, alignItems: "start" }}>
        <div className="card" style={{ padding: 36, borderRadius: 26 }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--blush-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto" }}>💌</div>
              <h2 style={{ font: "500 26px 'Playfair Display',serif", color: "var(--ink)", margin: "18px 0 0" }}>Message sent!</h2>
              <p style={{ font: "400 15px/1.7 Mulish", color: "#6c5a4a", margin: "10px 0 0" }}>
                Thanks for reaching out — we&apos;ll reply within one working day.
              </p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 style={{ font: "500 24px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 20px" }}>Send a message</h2>
              <Field label="Your name" error={errors.name}>
                <input className="field" placeholder="Jane Baker" value={form.name} onChange={upd("name")} />
              </Field>
              <Field label="Email" error={errors.email}>
                <input className="field" placeholder="jane@email.com" value={form.email} onChange={upd("email")} />
              </Field>
              <Field label="Message" error={errors.message}>
                <textarea className="field" rows={5} placeholder="How can we help?" value={form.message} onChange={upd("message")} style={{ resize: "vertical" }} />
              </Field>
              <Turnstile onVerify={setToken} />
              {submitError && <div className="field-error" style={{ margin: "10px 0" }}>{submitError}</div>}
              <button type="submit" disabled={sending} className="btn btn-primary" style={{ width: "100%", marginTop: 12, padding: 15, fontSize: 15, borderRadius: 14, opacity: sending ? 0.7 : 1 }}>
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <InfoCard title="Reach us">
            <div style={{ font: "500 16px Mulish", color: "var(--ink)", marginTop: 12 }}>hello@opendoorbakery.com</div>
            <div style={{ font: "400 13.5px Mulish", color: "var(--muted)", marginTop: 6 }}>We reply within one working day</div>
          </InfoCard>
          <InfoCard title="Order & collection times">
            <div style={{ font: "400 14.5px/1.9 Mulish", color: "#6c5a4a", marginTop: 10 }}>
              Tue – Fri · 8am – 2pm<br />Sat – Sun · 8am – 1pm<br />Mon · Closed (baking &amp; prep)
            </div>
          </InfoCard>
          <InfoCard title="Find us">
            <div style={{ font: "400 14.5px/1.7 Mulish", color: "#6c5a4a", marginTop: 10 }}>
              Open Door Bakery<br />Hamilton, Glasgow · ML3 7PD
            </div>
          </InfoCard>
        </div>
      </div>

      <div style={{ marginTop: 56 }}>
        <h2 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", textAlign: "center", margin: "0 0 26px" }}>Frequently asked</h2>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {FAQS.map((f) => (
            <details key={f.q} className="card" style={{ padding: "18px 22px", marginBottom: 12, borderRadius: 16 }}>
              <summary style={{ cursor: "pointer", font: "600 16px Mulish", color: "var(--ink)", listStyle: "none", display: "flex", justifyContent: "space-between", gap: 16 }}>
                {f.q} <span style={{ color: "var(--accent-deep)" }}>+</span>
              </summary>
              <p style={{ font: "400 14.5px/1.7 Mulish", color: "#6c5a4a", margin: "12px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="field-label">{label}</label>
      {children}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 26, borderRadius: 22 }}>
      <div style={{ font: "600 12px Mulish", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent-deep)" }}>{title}</div>
      {children}
    </div>
  );
}
