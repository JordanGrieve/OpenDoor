"use client";
import { useState } from "react";

export default function IngredientRow({
  id,
  name,
  unit,
  category,
  stock,
  costPerUnit,
}: {
  id: number;
  name: string;
  unit: string;
  category: string;
  stock: number;
  costPerUnit: number | null;
}) {
  const [value, setValue] = useState(String(stock));
  const [cost, setCost] = useState(costPerUnit === null ? "" : String(costPerUnit));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/admin/ingredients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const saveStock = async () => {
    if (Number(value) === stock) return;
    await patch({ stock: Number(value) });
  };

  const saveCost = async () => {
    const next = cost.trim() === "" ? null : Number(cost);
    if (next === costPerUnit) return;
    await patch({ costPerUnit: next });
  };

  const inputStyle: React.CSSProperties = {
    width: 84,
    padding: "8px 10px",
    border: "1.5px solid var(--line)",
    borderRadius: 10,
    font: "500 14px Mulish",
    color: "var(--ink)",
    textAlign: "right",
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
          onBlur={saveStock}
          type="number"
          step="0.01"
          title={`Stock held, in ${unit}`}
          style={inputStyle}
        />
        <span style={{ font: "500 12px Mulish", color: "var(--muted)", width: 30 }}>{unit}</span>
        <input
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          onBlur={saveCost}
          type="number"
          step="0.0001"
          min={0}
          placeholder="—"
          title={`Cost per ${unit} in £. Leave blank if you don't know it yet — margins will show as unknown rather than wrong.`}
          style={inputStyle}
        />
        <span style={{ font: "500 12px Mulish", color: "var(--muted)", width: 46 }}>£/{unit}</span>
        <span style={{ font: "600 11px Mulish", color: "#4a6b3a", width: 44 }}>{saving ? "…" : saved ? "saved" : ""}</span>
      </div>
    </div>
  );
}
