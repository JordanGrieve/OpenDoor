"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartContext";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/custom", label: "Custom Orders" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);

  // Slide the drawer in via a mount-transition (robust: resting state is on-screen).
  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = setTimeout(() => setEntered(true), 20);
    return () => clearTimeout(id);
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div
        style={{
          background: "var(--ink)",
          color: "#f3e7d6",
          textAlign: "center",
          font: "600 12.5px/1 Mulish,sans-serif",
          letterSpacing: ".06em",
          padding: "9px 16px",
        }}
      >
        Free local delivery on orders over £40 &nbsp;·&nbsp; Collection available Tue–Sun
      </div>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          background: "rgba(246,239,227,.86)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="wrap"
          style={{
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12 }} onClick={() => setOpen(false)}>
            <span style={{ textAlign: "left", lineHeight: 1.05 }}>
              <span style={{ display: "block", font: "500 19px 'Playfair Display',serif", color: "var(--ink)", letterSpacing: ".01em" }}>
                Open Door
              </span>
              <span style={{ display: "block", font: "600 9.5px Mulish", letterSpacing: ".26em", textTransform: "uppercase", color: "var(--muted)", marginTop: 2 }}>
                The door is always open
              </span>
            </span>
          </Link>

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            data-mobile-burger
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "var(--ink)", fontSize: 24, display: "none" }}
          >
            ☰
          </button>

          <nav data-desktop-nav style={{ display: "flex", alignItems: "center", gap: 30 }}>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                style={{ font: "600 14px Mulish", color: isActive(n.href) ? "var(--accent-deep)" : "var(--ink)" }}
              >
                {n.label}
                {isActive(n.href) && (
                  <div style={{ height: 2, background: "var(--accent)", borderRadius: 2, marginTop: 5 }} />
                )}
              </Link>
            ))}
            <Link
              href="/cart"
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--card)",
                border: "1.5px solid var(--line)",
                padding: "9px 16px 9px 14px",
                borderRadius: 999,
                font: "600 14px Mulish",
                color: "var(--ink)",
              }}
            >
              <span style={{ fontSize: 15 }}>🛍</span> Cart
              {ready && count > 0 && (
                <span
                  style={{
                    minWidth: 20,
                    height: 20,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: "var(--accent)",
                    color: "#fff",
                    font: "700 11px Mulish",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          </nav>
        </div>

      </header>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 60, animation: "overlayin .2s ease" }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "80%",
              maxWidth: 340,
              background: "var(--card)",
              zIndex: 61,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-24px 0 60px -30px rgba(0,0,0,.5)",
              transform: entered ? "translateX(0)" : "translateX(100%)",
              transition: "transform .25s ease",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ font: "500 18px 'Playfair Display',serif", color: "var(--ink)" }}>Open Door</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "var(--ink)", lineHeight: 1 }}>
                ×
              </button>
            </div>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                style={{ padding: "13px 0", font: "600 16px Mulish", color: isActive(n.href) ? "var(--accent-deep)" : "var(--ink)", borderBottom: "1px solid var(--line)" }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="btn btn-primary"
              style={{ marginTop: 18, padding: 14, textAlign: "center", fontSize: 15, borderRadius: 12 }}
            >
              🛍 View Cart {ready && count > 0 ? `(${count})` : ""}
            </Link>
          </aside>
        </>
      )}
    </>
  );
}
