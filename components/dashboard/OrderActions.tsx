"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus, OrderType } from "@/lib/types";

export default function OrderActions({
  id,
  type,
  status,
  size = "sm",
}: {
  id: number;
  type: OrderType;
  status: OrderStatus;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const setStatus = async (next: OrderStatus) => {
    setBusy(true);
    await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  };

  const cancel = async () => {
    if (!confirm("Cancel this order? A paid order will be refunded.")) return;
    setBusy(true);
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  };

  const terminal = ["collected", "dispatched", "cancelled", "refunded"].includes(status);
  const pad = size === "md" ? "10px 16px" : "7px 12px";
  const fs = size === "md" ? 13 : 12;

  const btn = (label: string, onClick: () => void, variant: "primary" | "ghost" | "danger" = "ghost") => (
    <button
      onClick={onClick}
      disabled={busy}
      className="btn"
      style={{
        padding: pad,
        fontSize: fs,
        fontWeight: 700,
        borderRadius: 999,
        border: variant === "ghost" ? "1.5px solid var(--line)" : "none",
        background: variant === "primary" ? "var(--accent)" : variant === "danger" ? "transparent" : "var(--card)",
        color: variant === "primary" ? "#fff" : variant === "danger" ? "var(--danger)" : "var(--ink)",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {(status === "pending" || status === "confirmed") && btn("Mark ready", () => setStatus("ready"), "primary")}
      {status === "ready" && type === "delivery" && btn("Mark dispatched", () => setStatus("dispatched"), "primary")}
      {status === "ready" && type !== "delivery" && btn("Mark collected", () => setStatus("collected"), "primary")}
      {!terminal && btn("Cancel", cancel, "danger")}
    </div>
  );
}
