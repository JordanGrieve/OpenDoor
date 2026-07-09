import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)", padding: 24, textAlign: "center" }}>
      <div>
        <div style={{ font: "500 20px 'Playfair Display',serif", color: "var(--muted)" }}>Open Door Bakery</div>
        <h1 style={{ font: "500 clamp(40px,7vw,64px)/1 'Playfair Display',serif", color: "var(--ink)", margin: "12px 0 0" }}>Page not found</h1>
        <p style={{ font: "400 16px/1.7 Mulish", color: "#6c5a4a", margin: "12px 0 0" }}>
          This page has crumbled away. Let&apos;s get you back to the good stuff.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: "inline-block", marginTop: 24, padding: "14px 28px", fontSize: 15 }}>
          Back to home →
        </Link>
      </div>
    </main>
  );
}
