import Link from "next/link";
import type { ProductSummary } from "@/lib/types";
import { formatGBP } from "@/lib/money";
import ProductPhoto from "@/components/store/ProductPhoto";

export default function ProductCard({ product }: { product: ProductSummary }) {
  const leadLabel =
    product.leadTimeDays <= 0
      ? "Ready today"
      : product.leadTimeDays === 1
      ? "Ready tomorrow"
      : `Ready in ${product.leadTimeDays} days`;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column", color: "inherit" }}
    >
      <div className="sheen" style={{ position: "relative", height: 200, overflow: "hidden" }}>
        <ProductPhoto url={product.imageUrl} category={product.category} alt={product.name} />
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "var(--ink)",
            color: "#f3e7d6",
            font: "600 10.5px Mulish",
            padding: "5px 10px",
            borderRadius: 999,
            zIndex: 1,
          }}
        >
          {leadLabel}
        </span>
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
        {product.allergens.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {product.allergens.map((a) => (
              <span
                key={a.id}
                style={{
                  font: "600 10px Mulish",
                  letterSpacing: ".04em",
                  color: "var(--accent-deep)",
                  background: "var(--blush-soft)",
                  padding: "3px 9px",
                  borderRadius: 999,
                }}
              >
                {a.name}
              </span>
            ))}
          </div>
        )}
        <span style={{ font: "600 18px 'Playfair Display',serif", color: "var(--ink)" }}>
          {product.name}
        </span>
        <p style={{ font: "400 13px/1.55 Mulish", color: "#6c5a4a", margin: "6px 0 0", flex: 1 }}>
          {product.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 15 }}>
          <span style={{ font: "600 17px 'Playfair Display',serif", color: "var(--ink)" }}>
            {product.hasVariants ? `from ${formatGBP(product.price)}` : formatGBP(product.price)}
          </span>
          <span aria-hidden="true" style={{ font: "600 15px Mulish", color: "var(--accent-deep)" }}>
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
