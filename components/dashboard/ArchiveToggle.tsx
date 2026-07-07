"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArchiveToggle({ id, archived }: { id: number; archived: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    await fetch(`/api/admin/products/${id}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !archived }),
    });
    setBusy(false);
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="btn"
      style={{ background: "none", border: "1.5px solid var(--line)", borderRadius: 999, padding: "6px 12px", font: "600 12px Mulish", color: "var(--muted)", opacity: busy ? 0.6 : 1 }}
    >
      {archived ? "Restore" : "Archive"}
    </button>
  );
}
