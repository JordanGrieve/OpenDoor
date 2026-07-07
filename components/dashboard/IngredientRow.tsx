"use client";
import { useState } from "react";

export default function IngredientRow({
  id,
  name,
  unit,
  category,
  stock,
}: {
  id: number;
  name: string;
  unit: string;
  category: string;
  stock: number;
}) {
  const [value, setValue] = useState(String(stock));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (Number(value) === stock) return;
    setSaving(true);
    await fetch(`/api/admin/ingredients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: Number(value) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <div>
        <div style={{ font: "600 14px Mulish", color: "var(--ink)" }}>{name}</div>
        <div style={{ font: "500 12px Mulish", color: "var(--muted)" }}>{category}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          type="number"
          step="0.01"
          style={{ width: 90, padding: "8px 10px", border: "1.5px solid var(--line)", borderRadius: 10, font: "500 14px Mulish", color: "var(--ink)", textAlign: "right" }}
        />
        <span style={{ font: "500 12px Mulish", color: "var(--muted)", width: 34 }}>{unit}</span>
        <span style={{ font: "600 11px Mulish", color: "#4a6b3a", width: 44 }}>{saving ? "…" : saved ? "saved" : ""}</span>
      </div>
    </div>
  );
}
