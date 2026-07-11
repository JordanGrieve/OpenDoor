"use client";
import Link from "next/link";
import { useState } from "react";

const HEAD: React.CSSProperties = {
  font: "600 12px Mulish",
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color: "#fbf3e6",
};
const LINK: React.CSSProperties = { color: "#b3a18d", font: "500 14px Mulish" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
      <button
        className="footer-acc-head"
        onClick={() => setOpen((o) => !o)}
        style={{ ...HEAD, background: "none", border: "none", padding: "14px 0", width: "100%", textAlign: "left", cursor: "pointer" }}
      >
        <span>{title}</span>
        <span className="footer-acc-icon" style={{ color: "#9c8a78", fontSize: 18 }}>{open ? "–" : "+"}</span>
      </button>
      <div
        className="footer-acc-body"
        data-open={open}
        style={{ flexDirection: "column", gap: 10, alignItems: "flex-start", paddingBottom: 16 }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer style={{ background: "var(--ink)", color: "#d8c7b2", marginTop: 20 }}>
      <div className="wrap footer-grid" style={{ padding: "64px 24px 30px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40 }}>
        <div style={{ paddingBottom: 8 }}>
          <span style={{ font: "500 20px 'Playfair Display',serif", color: "#fbf3e6" }}>Open Door</span>
          <p style={{ font: "400 14px/1.7 Mulish", color: "#b3a18d", margin: "16px 0 0", maxWidth: 280 }}>
            Handmade pastries and celebration boxes, baked fresh in Hamilton. Collection &amp; local delivery across Lanarkshire.
          </p>
        </div>

        <Section title="Shop">
          <Link href="/shop" style={LINK}>All products</Link>
          <Link href="/shop?category=Mixed+Boxes" style={LINK}>Mixed boxes</Link>
          <Link href="/shop?category=Celebration+Boxes" style={LINK}>Celebration boxes</Link>
        </Section>

        <Section title="Help">
          <Link href="/custom" style={LINK}>Custom orders</Link>
          <Link href="/contact" style={LINK}>Contact &amp; FAQ</Link>
          <Link href="/orders" style={LINK}>Track / cancel an order</Link>
        </Section>

        <Section title="Visit">
          <p style={{ font: "400 14px/1.7 Mulish", color: "#b3a18d", margin: 0 }}>
            Hamilton, Glasgow<br />ML3 7PD<br />Collection Tue–Sun
          </p>
        </Section>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div
          className="wrap"
          style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, font: "500 12.5px Mulish", color: "#8c7c69" }}
        >
          <span>© 2026 Open Door. Made with care.</span>
          <span>Allergen info available on every product.</span>
        </div>
      </div>
    </footer>
  );
}
