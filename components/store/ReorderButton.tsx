"use client";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import type { CartItem } from "@/lib/types";

export default function ReorderButton({ items }: { items: CartItem[] }) {
  const { add } = useCart();
  const router = useRouter();

  const reorder = () => {
    items.forEach((i) => add(i));
    router.push("/cart");
  };

  if (items.length === 0) {
    return <span style={{ font: "500 12px Mulish", color: "var(--muted)" }}>Items no longer available</span>;
  }
  return (
    <button onClick={reorder} className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 13 }}>
      Reorder →
    </button>
  );
}
