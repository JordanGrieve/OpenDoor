"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Allergen, ProductSummary } from "@/lib/types";
import ProductCard from "@/components/store/ProductCard";

export default function ShopClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);

  const category = params.get("category") || "All";
  // allergens to EXCLUDE (hide products containing them)
  const excluded = useMemo(
    () => new Set((params.get("exclude") || "").split(",").filter(Boolean)),
    [params]
  );

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/allergens").then((r) => r.json()),
    ])
      .then(([p, a]) => {
        if (!alive) return;
        setProducts(p.products ?? []);
        setAllergens(a.allergens ?? []);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "" || value === "All") next.delete(key);
    else next.set(key, value);
    router.replace(`/shop?${next.toString()}`, { scroll: false });
  };

  const toggleAllergen = (slug: string) => {
    const next = new Set(excluded);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setParam("exclude", Array.from(next).join(","));
  };

  const filtered = products.filter((p) => {
    if (category !== "All" && p.category !== category) return false;
    if (excluded.size > 0 && p.allergens.some((a) => excluded.has(a.slug))) return false;
    return true;
  });

  return (
    <main className="pbfade wrap" style={{ padding: "56px 24px 90px" }}>
      <div style={{ textAlign: "center", marginBottom: 34 }}>
        <span className="eyebrow">The whole counter</span>
        <h1 style={{ font: "500 clamp(36px,5vw,52px)/1 'Playfair Display',serif", color: "var(--ink)", margin: "10px 0 0" }}>Shop</h1>
        <p style={{ font: "400 16px/1.6 Mulish", color: "#6c5a4a", margin: "12px auto 0", maxWidth: 520 }}>
          Freshly baked to order. Choose your favourites — filter by category or hide anything you can&apos;t eat.
        </p>
      </div>

      {/* Category chips */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 18 }}>
        {categories.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              onClick={() => setParam("category", c)}
              className="btn"
              style={{
                border: `1.5px solid ${active ? "var(--accent)" : "var(--line)"}`,
                background: active ? "var(--accent)" : "var(--card)",
                color: active ? "#fff" : "var(--ink)",
                padding: "9px 18px",
                borderRadius: 999,
                font: "600 13.5px Mulish",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Allergen filter — single scrollable line */}
      {allergens.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <span style={{ font: "600 12px Mulish", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
            Hide items with:
          </span>
          <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", flexWrap: "nowrap", flex: 1, paddingBottom: 2, WebkitOverflowScrolling: "touch" }}>
            {allergens.map((a) => {
              const on = excluded.has(a.slug);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAllergen(a.slug)}
                  className="btn"
                  style={{
                    border: `1.5px solid ${on ? "var(--danger)" : "var(--line)"}`,
                    background: on ? "var(--blush-soft)" : "var(--card)",
                    color: on ? "var(--danger)" : "var(--muted)",
                    padding: "6px 13px",
                    borderRadius: 999,
                    font: "600 12.5px Mulish",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {on ? "✕ " : ""}
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--muted)", font: "500 15px Mulish" }}>Loading the counter…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--muted)", font: "500 15px Mulish" }}>
          Nothing matches those filters — try clearing an allergen.
        </p>
      ) : (
        <div className="grid-3cols">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
