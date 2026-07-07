import type { OrderStatus, OrderType } from "@/lib/types";

const STATUS: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  pending: { label: "Awaiting payment", bg: "#f3e7d6", color: "#9c6f43" },
  confirmed: { label: "Confirmed", bg: "#e7efe0", color: "#4a6b3a" },
  ready: { label: "Ready", bg: "#f6e3df", color: "#9c4a3a" },
  collected: { label: "Collected", bg: "#e8dcc9", color: "#6c5a4a" },
  dispatched: { label: "Dispatched", bg: "#e8dcc9", color: "#6c5a4a" },
  cancelled: { label: "Cancelled", bg: "#f0d8d0", color: "#b5482f" },
  refunded: { label: "Refunded", bg: "#f0d8d0", color: "#b5482f" },
};

const TYPE: Record<OrderType, string> = {
  collection: "🏡 Collection",
  delivery: "🚲 Delivery",
  contract: "📄 Contract",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status] ?? STATUS.pending;
  return (
    <span style={{ font: "600 11px Mulish", background: s.bg, color: s.color, padding: "4px 10px", borderRadius: 999 }}>
      {s.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: OrderType }) {
  return (
    <span style={{ font: "600 11px Mulish", color: "var(--muted)", background: "var(--cream-deep)", padding: "4px 10px", borderRadius: 999 }}>
      {TYPE[type] ?? type}
    </span>
  );
}
