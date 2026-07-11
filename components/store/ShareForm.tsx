"use client";
import { useState } from "react";

interface Props {
  kind: "photo" | "review";
  buttonLabel: string;
  heading: string;
  blurb: string;
  messagePlaceholder: string;
  withRating?: boolean;
}

export default function ShareForm({ kind, buttonLabel, heading, blurb, messagePlaceholder, withRating }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Please add your name.");
    if (!emailOk(form.email)) return setError("Please enter a valid email.");
    if (!form.message.trim()) return setError("Please add a message.");
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...form, ...(withRating ? { rating } : {}) }),
      });
      if (res.ok) setDone(true);
      else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Something went wrong. Please try again.");
        setSending(false);
      }
    } catch {
      setError("Couldn't send — please try again shortly.");
      setSending(false);
    }
  };

  if (done) {
    return (
      <div style={{ font: "500 15px Mulish", color: "var(--accent-deep)", background: "var(--blush-soft)", borderRadius: 14, padding: "14px 18px", display: "inline-block" }}>
        {kind === "review" ? "Thank you — we've got your review! 💛" : "Thanks — we'll be in touch about your photo!"}
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-primary" style={{ padding: "14px 28px", fontSize: 15 }}>
        {buttonLabel}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 460, margin: "0 auto", padding: 28, textAlign: "left" }}>
      <h3 style={{ font: "500 20px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 4px" }}>{heading}</h3>
      <p style={{ font: "400 13.5px/1.6 Mulish", color: "#6c5a4a", margin: "0 0 16px" }}>{blurb}</p>

      {withRating && (
        <div style={{ marginBottom: 14 }}>
          <label className="field-label">Rating</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star`} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 26, lineHeight: 1, color: n <= rating ? "var(--accent)" : "var(--line)" }}>
                ★
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        <input className="field" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="field" placeholder="you@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <textarea className="field" rows={4} placeholder={messagePlaceholder} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ resize: "vertical" }} />
      </div>
      {error && <div className="field-error" style={{ marginTop: 10 }}>{error}</div>}
      <button type="submit" disabled={sending} className="btn btn-primary" style={{ width: "100%", marginTop: 14, padding: 14, fontSize: 15, borderRadius: 14, opacity: sending ? 0.7 : 1 }}>
        {sending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
