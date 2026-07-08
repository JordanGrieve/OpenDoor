"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProductSummary } from "@/lib/types";
import { formatGBP } from "@/lib/money";
import ProductPhoto from "@/components/store/ProductPhoto";
import { useCart } from "@/components/cart/CartContext";

export default function ProductCard({ product }: { product: ProductSummary }) {
  const { add } = useCart();
  const router = useRouter();

  const leadLabel =
    product.leadTimeDays <= 0
      ? "Ready today"
      : product.leadTimeDays === 1
      ? "Ready tomorrow"
      : `Ready in ${product.leadTimeDays} days`;

  const onAdd = () => {
    // Products with real variant choices go to the detail page to choose.
    if (product.hasVariants) {
      router.push(`/products/${product.slug}`);
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      variantId: null,
      name: product.name,
      variantLabel: null,
      price: product.price,
      quantity: 1,
      leadTimeDays: product.leadTimeDays,
      imageUrl: product.imageUrl,
      celebration: product.celebration,
    });
  };

  return (
    <div
      className="card"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="sheen"
        style={{ position: "relative", height: 200, display: "block", overflow: "hidden" }}
      >
        <ProductPhoto url={product.imageUrl} category={product.category} alt={product.name} />
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(255,255,255,.9)",
            color: "var(--accent-deep)",
            font: "600 10.5px Mulish",
            letterSpacing: ".05em",
            padding: "5px 10px",
            borderRadius: 999,
            zIndex: 1,
          }}
        >
          {product.category}
        </span>
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
      </Link>
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
        <Link
          href={`/products/${product.slug}`}
          style={{ font: "600 18px 'Playfair Display',serif", color: "var(--ink)" }}
        >
          {product.name}
        </Link>
        <p style={{ font: "400 13px/1.55 Mulish", color: "#6c5a4a", margin: "6px 0 0", flex: 1 }}>
          {product.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 15 }}>
          <span style={{ font: "600 17px 'Playfair Display',serif", color: "var(--ink)" }}>
            {product.hasVariants ? `from ${formatGBP(product.price)}` : formatGBP(product.price)}
          </span>
          <button
            onClick={onAdd}
            className="btn btn-primary"
            style={{ padding: "10px 16px", fontSize: 12.5 }}
          >
            {product.hasVariants ? "Choose" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
