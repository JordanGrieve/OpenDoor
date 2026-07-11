"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { formatGBP } from "@/lib/money";
import ProductPhoto from "@/components/store/ProductPhoto";
import { useCart } from "@/components/cart/CartContext";

export default function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const router = useRouter();

  const variants = product.variants.length
    ? product.variants
    : [{ id: 0, productId: product.id, label: "Standard", price: product.price, stockLimit: null, sortOrder: 0 }];
  const showVariantPicker = variants.length > 1;

  const [variantId, setVariantId] = useState(variants[0].id);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const price = variant.price;

  const leadLabel =
    product.leadTimeDays <= 0
      ? "Ready today"
      : product.leadTimeDays === 1
      ? "Ready tomorrow"
      : `Ready in ${product.leadTimeDays} days`;

  const galleryUrls: (string | null)[] =
    product.images.length > 0 ? product.images.map((i) => i.url) : [null];
  const [activeImg, setActiveImg] = useState(0);

  const onAdd = () => {
    add({
      productId: product.id,
      slug: product.slug,
      variantId: variant.id || null,
      name: product.name,
      variantLabel: showVariantPicker ? variant.label : null,
      price,
      quantity: qty,
      leadTimeDays: product.leadTimeDays,
      imageUrl: product.images[0]?.url ?? null,
      celebration: product.celebration,
      notes: notes.trim() || undefined,
    });
    router.push("/cart");
  };

  return (
    <main className="pbfade wrap" style={{ padding: "36px 24px 90px", maxWidth: 1100 }}>
      <Link href="/shop" style={{ font: "600 13.5px Mulish", color: "var(--muted)", marginBottom: 22, display: "inline-block" }}>
        ← Back to shop
      </Link>
      <div className="grid-2cols" style={{ gap: 50, alignItems: "start" }}>
        {/* Gallery */}
        <div style={{ position: "sticky", top: 90 }}>
          <div className="sheen" style={{ position: "relative", aspectRatio: "1", borderRadius: 28, overflow: "hidden", boxShadow: "0 30px 56px -30px rgba(120,80,40,.5)" }}>
            <ProductPhoto url={galleryUrls[activeImg]} category={product.category} alt={product.name} />
            <span style={{ position: "absolute", top: 14, right: 14, background: "var(--ink)", color: "#f3e7d6", font: "600 11px Mulish", padding: "6px 12px", borderRadius: 999, zIndex: 1 }}>
              {leadLabel}
            </span>
          </div>
          {galleryUrls.length > 1 && (
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              {galleryUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                  style={{ position: "relative", width: 64, height: 64, borderRadius: 14, overflow: "hidden", padding: 0, border: i === activeImg ? "2px solid var(--accent)" : "2px solid transparent", cursor: "pointer", background: "none" }}
                >
                  <ProductPhoto url={url} category={product.category} alt={`${product.name} thumbnail ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <span className="eyebrow" style={{ letterSpacing: ".14em" }}>{product.category}</span>
          <h1 style={{ font: "500 clamp(32px,4.4vw,46px)/1.05 'Playfair Display',serif", color: "var(--ink)", margin: "8px 0 0" }}>
            {product.name}
          </h1>
          <div style={{ font: "600 26px 'Playfair Display',serif", color: "var(--accent-deep)", margin: "14px 0 0" }}>
            {formatGBP(price)}
          </div>

          {product.allergens.length > 0 && (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "16px 0 0" }}>
              {product.allergens.map((a) => (
                <span key={a.id} style={{ font: "600 11px Mulish", color: "var(--accent-deep)", background: "var(--blush-soft)", padding: "5px 11px", borderRadius: 999 }}>
                  {a.name}
                </span>
              ))}
            </div>
          )}

          <p style={{ font: "400 16px/1.75 Mulish", color: "#6c5a4a", margin: "20px 0 0" }}>{product.description}</p>

          {/* Variant picker */}
          {showVariantPicker && (
            <div style={{ margin: "24px 0 0" }}>
              <label className="field-label">Choose an option</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {variants.map((v) => {
                  const on = v.id === variantId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      className="btn"
                      style={{
                        border: `1.5px solid ${on ? "var(--accent)" : "var(--line)"}`,
                        background: on ? "var(--blush-soft)" : "var(--card)",
                        color: "var(--ink)",
                        padding: "12px 16px",
                        borderRadius: 14,
                        font: "600 14px Mulish",
                      }}
                    >
                      {v.label} · {formatGBP(v.price)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* qty + add */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "26px 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--line)", borderRadius: 999, overflow: "hidden", background: "var(--card)" }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="btn" style={{ width: 46, height: 46, fontSize: 20, color: "var(--ink)", background: "none" }}>−</button>
              <span style={{ minWidth: 40, textAlign: "center", font: "600 17px Mulish", color: "var(--ink)" }}>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="btn" style={{ width: 46, height: 46, fontSize: 20, color: "var(--ink)", background: "none" }}>+</button>
            </div>
            <button onClick={onAdd} className="btn btn-primary" style={{ flex: 1, padding: "15px 28px", fontSize: 15 }}>
              Add to Cart · {formatGBP(price * qty)}
            </button>
          </div>

          {/* personalise for celebration items */}
          {product.celebration && (
            <div style={{ marginTop: 22 }}>
              <label className="field-label">
                Personalise your box{" "}
                <span style={{ color: "var(--accent-deep)", textTransform: "none", letterSpacing: 0 }}>
                  (message, flavour, name on the cake)
                </span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. 'Happy 30th Sarah', pistachio sponge please"
                className="field"
                style={{ resize: "vertical" }}
              />
            </div>
          )}

          {/* accordions */}
          <div style={{ marginTop: 26, borderTop: "1px solid var(--line)" }}>
            <Accordion title="Collection & delivery">
              Freshly baked to order. Collect from our Hamilton kitchen Tue–Sun, or choose local delivery within about
              8 miles (Motherwell, Bothwell, Blantyre, East Kilbride &amp; more) — free over £40, otherwise £4.50. Order before 4pm for next day.
            </Accordion>
            <Accordion title="Allergens">
              {product.allergens.length
                ? `Contains ${product.allergens.map((a) => a.name.toLowerCase()).join(", ")}. Made in a small kitchen that also handles nuts and soya.`
                : "Please ask about allergens — everything is made in a small kitchen that handles gluten, dairy, egg and nuts."}
            </Accordion>
            <Accordion title="Storage & freshness">
              Best enjoyed the day of collection or delivery. Keep in a cool dry place; cakes and tarts in the fridge. Most
              bakes freeze beautifully for up to a month.
            </Accordion>
          </div>
        </div>
      </div>
    </main>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details style={{ borderBottom: "1px solid var(--line)", padding: "16px 0" }}>
      <summary style={{ cursor: "pointer", font: "600 15px Mulish", color: "var(--ink)", listStyle: "none", display: "flex", justifyContent: "space-between" }}>
        {title} <span style={{ color: "var(--accent-deep)" }}>+</span>
      </summary>
      <p style={{ font: "400 14.5px/1.7 Mulish", color: "#6c5a4a", margin: "12px 0 0" }}>{children}</p>
    </details>
  );
}
