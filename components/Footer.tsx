import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "var(--ink)", color: "#d8c7b2", marginTop: 20 }}>
      <div
        className="wrap footer-grid"
        style={{ padding: "64px 24px 30px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40 }}
      >
        <div>
          <span style={{ font: "500 20px 'Playfair Display',serif", color: "#fbf3e6" }}>Open Door</span>
          <p style={{ font: "400 14px/1.7 Mulish", color: "#b3a18d", margin: "16px 0 0", maxWidth: 280 }}>
            Handmade pastries and celebration boxes, baked fresh in Hamilton. Collection &amp; local delivery across Lanarkshire.
          </p>
        </div>
        <div>
          <div style={{ font: "600 12px Mulish", letterSpacing: ".12em", textTransform: "uppercase", color: "#fbf3e6", marginBottom: 14 }}>
            Shop
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/shop" style={{ color: "#b3a18d", font: "500 14px Mulish" }}>All products</Link>
            <Link href="/shop?category=Mixed+Boxes" style={{ color: "#b3a18d", font: "500 14px Mulish" }}>Mixed boxes</Link>
            <Link href="/shop?category=Celebration+Boxes" style={{ color: "#b3a18d", font: "500 14px Mulish" }}>Celebration boxes</Link>
          </div>
        </div>
        <div>
          <div style={{ font: "600 12px Mulish", letterSpacing: ".12em", textTransform: "uppercase", color: "#fbf3e6", marginBottom: 14 }}>
            Help
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/custom" style={{ color: "#b3a18d", font: "500 14px Mulish" }}>Custom orders</Link>
            <Link href="/contact" style={{ color: "#b3a18d", font: "500 14px Mulish" }}>Contact &amp; FAQ</Link>
            <Link href="/orders" style={{ color: "#b3a18d", font: "500 14px Mulish" }}>Track / cancel an order</Link>
          </div>
        </div>
        <div>
          <div style={{ font: "600 12px Mulish", letterSpacing: ".12em", textTransform: "uppercase", color: "#fbf3e6", marginBottom: 14 }}>
            Visit
          </div>
          <p style={{ font: "400 14px/1.7 Mulish", color: "#b3a18d", margin: 0 }}>
            Hamilton, Glasgow<br />ML3 7PD<br />Collection Tue–Sun
          </p>
        </div>
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
