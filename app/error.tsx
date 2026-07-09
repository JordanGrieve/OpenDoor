"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)", padding: 24, textAlign: "center" }}>
      <div>
        <div style={{ font: "500 20px 'Playfair Display',serif", color: "var(--muted)" }}>Open Door Bakery</div>
        <h1 style={{ font: "500 clamp(32px,5vw,48px)/1.05 'Playfair Display',serif", color: "var(--ink)", margin: "12px 0 0" }}>Something went wrong</h1>
        <p style={{ font: "400 16px/1.7 Mulish", color: "#6c5a4a", margin: "12px 0 0", maxWidth: 420 }}>
          Sorry — that didn&apos;t work. Please try again, and if it keeps happening, get in touch.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
          <button onClick={reset} className="btn btn-primary" style={{ padding: "13px 26px", fontSize: 15 }}>Try again</button>
          <Link href="/" className="btn btn-outline" style={{ padding: "13px 24px", fontSize: 15 }}>Home</Link>
        </div>
      </div>
    </main>
  );
}
