"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOut from "@/components/dashboard/SignOut";

const LINKS = [
  { href: "/dashboard", label: "Orders", exact: true },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/reviews", label: "Reviews" },
  { href: "/dashboard/stock", label: "Stock & shopping" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/analytics", label: "Analytics" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        background: "var(--ink)",
        color: "#e8dcc9",
        minHeight: "100vh",
        padding: "24px 16px",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "0 8px 20px" }}>
        <div style={{ font: "500 20px 'Playfair Display',serif", color: "#fbf3e6" }}>Open Door</div>
        <div style={{ font: "600 9px Mulish", letterSpacing: ".2em", textTransform: "uppercase", color: "#9c8a78", marginTop: 2 }}>
          Owner dashboard
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {LINKS.map((l) => {
          const on = active(l.href, l.exact);
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                padding: "11px 14px",
                borderRadius: 10,
                font: "600 14px Mulish",
                color: on ? "#fbf3e6" : "#c9b8a3",
                background: on ? "rgba(192,138,82,.28)" : "transparent",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
        <Link href="/" style={{ padding: "10px 14px", font: "500 13px Mulish", color: "#9c8a78" }}>
          ↗ View storefront
        </Link>
        <SignOut />
      </div>
    </aside>
  );
}
