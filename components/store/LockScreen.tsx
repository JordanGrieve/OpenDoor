"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LOCK_MESSAGE } from "@/lib/config";
import { safeReturnPath } from "@/lib/site-lock";

const HERO_IMAGE =
  "https://res.cloudinary.com/pvw2usoi/image/upload/f_auto,q_auto/open-door/hero-home";

function Screen() {
  const router = useRouter();
  const params = useSearchParams();

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState("");

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setUnlocking(true);
    try {
      const res = await fetch("/api/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(safeReturnPath(params.get("from")));
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setPasswordError(data.error || "That password isn't right.");
    } catch {
      setPasswordError("Couldn't check that just now — please try again.");
    }
    setUnlocking(false);
  };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "newsletter", email }),
      });
    } catch {
      /* non-blocking, same as the storefront newsletter */
    }
    setSubscribed(true);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cream)",
        padding: "48px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${HERO_IMAGE}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.32,
          zIndex: 1,
        }}
      />
      {/* Cream veil: keeps the copy legible over a busy photo while the
          artwork still shows through at the edges. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(68% 62% at 50% 48%, rgba(246,239,227,.94) 0%, rgba(246,239,227,.82) 45%, rgba(246,239,227,.42) 100%)",
          zIndex: 1,
        }}
      />

      <div
        className="pbfade"
        style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 560, textAlign: "center" }}
      >
        <div
          style={{
            font: "600 10px Mulish",
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "var(--accent-deep)",
          }}
        >
          Hamilton · Coming soon
        </div>

        <h1
          style={{
            font: "500 clamp(40px,6.5vw,64px)/1 'Playfair Display',serif",
            letterSpacing: "-.02em",
            color: "var(--ink)",
            margin: "14px 0 0",
          }}
        >
          Open Door Bakery
        </h1>

        <p style={{ font: "400 17px/1.7 Mulish", color: "#6c5a4a", margin: "20px auto 0", maxWidth: 460 }}>
          {LOCK_MESSAGE}
        </p>

        {/* ── Newsletter ── */}
        <div
          style={{
            background: "var(--ink)",
            borderRadius: 24,
            padding: "32px 28px",
            marginTop: 36,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(60% 120% at 85% 10%,rgba(192,138,82,.35),transparent 55%)",
            }}
          />
          <div style={{ position: "relative" }}>
            <h2 style={{ font: "500 24px 'Playfair Display',serif", color: "#fbf3e6", margin: 0 }}>
              First to know, first to taste
            </h2>
            {subscribed ? (
              <div
                style={{
                  margin: "20px auto 0",
                  maxWidth: 420,
                  background: "rgba(255,255,255,.1)",
                  border: "1px solid rgba(255,255,255,.2)",
                  borderRadius: 14,
                  padding: 16,
                  color: "#fbf3e6",
                  font: "600 15px Mulish",
                }}
              >
                Thank you — you&apos;re on the list. 🥐
              </div>
            ) : (
              <form
                onSubmit={subscribe}
                className="newsletter-form"
                style={{ margin: "20px auto 0", maxWidth: 440, display: "flex", gap: 10 }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email address"
                  style={{
                    flex: 1,
                    padding: "14px 18px",
                    borderRadius: 999,
                    border: "none",
                    background: "#fffdf8",
                    color: "var(--ink)",
                    font: "400 15px Mulish",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "14px 26px", fontSize: 14, whiteSpace: "nowrap" }}
                >
                  Subscribe
                </button>
              </form>
            )}
            {emailError && (
              <div style={{ color: "var(--blush)", font: "600 13px Mulish", marginTop: 10 }}>{emailError}</div>
            )}
          </div>
        </div>

        {/* ── Team access ── */}
        <form onSubmit={unlock} style={{ marginTop: 32 }}>
          <div
            style={{
              font: "600 10px Mulish",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Working on the site?
          </div>
          <div style={{ display: "flex", gap: 10, margin: "12px auto 0", maxWidth: 380 }}>
            <input
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Site password"
              style={{ flex: 1, marginTop: 0 }}
            />
            <button
              type="submit"
              disabled={unlocking}
              className="btn btn-outline"
              style={{ padding: "0 22px", fontSize: 14, whiteSpace: "nowrap" }}
            >
              {unlocking ? "Checking…" : "Enter"}
            </button>
          </div>
          {passwordError && (
            <div className="field-error" style={{ marginTop: 10 }}>
              {passwordError}
            </div>
          )}
        </form>

        <div style={{ font: "400 13px Mulish", color: "var(--muted)", marginTop: 32 }}>
          Open Door Bakery · Hamilton, Glasgow
        </div>
      </div>
    </main>
  );
}

export default function LockScreen() {
  return (
    <Suspense>
      <Screen />
    </Suspense>
  );
}
