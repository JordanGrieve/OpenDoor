"use client";
import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setErr("Enter a valid email address");
      return;
    }
    setErr("");
    // Isolated: contact/newsletter simply notifies the owner for now.
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "newsletter", email }),
      });
    } catch {
      /* non-blocking */
    }
    setDone(true);
  };

  return (
    <section className="wrap" style={{ padding: "24px 24px 90px" }}>
      <div style={{ background: "var(--ink)", borderRadius: 30, padding: "60px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 120% at 85% 10%,rgba(192,138,82,.35),transparent 55%)" }} />
        <div style={{ position: "relative" }}>
          <h2 style={{ font: "500 clamp(28px,3.6vw,40px)/1.1 'Playfair Display',serif", color: "#fbf3e6", margin: 0 }}>
            First to know, first to taste
          </h2>
          <p style={{ font: "400 16px/1.6 Mulish", color: "#d8c7b2", margin: "14px auto 0", maxWidth: 460 }}>
            Seasonal specials, new boxes and the odd discount — straight to your inbox. No spam, just sweetness.
          </p>
          {done ? (
            <div style={{ margin: "26px auto 0", maxWidth: 420, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 14, padding: 16, color: "#fbf3e6", font: "600 15px Mulish" }}>
              Thank you — you&apos;re on the list. 🥐
            </div>
          ) : (
            <form onSubmit={submit} style={{ margin: "26px auto 0", maxWidth: 440, display: "flex", gap: 10 }}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={{ flex: 1, padding: "14px 18px", borderRadius: 999, border: "none", background: "#fffdf8", color: "var(--ink)", font: "400 15px Mulish", outline: "none" }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "14px 26px", fontSize: 14, whiteSpace: "nowrap" }}>
                Subscribe
              </button>
            </form>
          )}
          {err && <div style={{ color: "var(--blush)", font: "600 13px Mulish", marginTop: 10 }}>{err}</div>}
        </div>
      </div>
    </section>
  );
}
