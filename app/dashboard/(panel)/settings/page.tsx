"use client";
import { useEffect, useState } from "react";
import type { CollectionSlot, DeliverySettings } from "@/lib/types";

interface Postcode { id: number; prefix: string; active: boolean }

export default function SettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [slots, setSlots] = useState<CollectionSlot[]>([]);
  const [postcodes, setPostcodes] = useState<Postcode[]>([]);
  const [savedMsg, setSavedMsg] = useState("");

  const [newSlot, setNewSlot] = useState({ slotTime: "", label: "" });
  const [newPrefix, setNewPrefix] = useState("");

  const load = async () => {
    const d = await fetch("/api/admin/settings").then((r) => r.json());
    setSettings(d.settings);
    setSlots(d.slots ?? []);
    setPostcodes(d.postcodes ?? []);
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (!settings) return;
    await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setSavedMsg("Saved");
    setTimeout(() => setSavedMsg(""), 1500);
  };

  const addSlot = async () => {
    if (!newSlot.slotTime || !newSlot.label) return;
    await fetch("/api/admin/slots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSlot) });
    setNewSlot({ slotTime: "", label: "" });
    load();
  };
  const toggleSlot = async (s: CollectionSlot) => {
    await fetch(`/api/admin/slots/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !s.active }) });
    load();
  };
  const removeSlot = async (id: number) => {
    await fetch(`/api/admin/slots/${id}`, { method: "DELETE" });
    load();
  };

  const addPostcode = async () => {
    if (!newPrefix.trim()) return;
    await fetch("/api/admin/postcodes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefix: newPrefix }) });
    setNewPrefix("");
    load();
  };
  const removePostcode = async (id: number) => {
    await fetch(`/api/admin/postcodes/${id}`, { method: "DELETE" });
    load();
  };

  if (!settings) return <div style={{ color: "var(--muted)", font: "500 15px Mulish" }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 20px" }}>Settings</h1>

      {/* Delivery */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={sec}>Delivery &amp; origin</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <F label="Delivery fee (£)"><input className="field" type="number" step="0.01" value={settings.deliveryFee} onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })} /></F>
          <F label="Free delivery over (£)"><input className="field" type="number" step="0.01" value={settings.freeDeliveryMin} onChange={(e) => setSettings({ ...settings, freeDeliveryMin: Number(e.target.value) })} /></F>
          <F label="Origin postcode"><input className="field" value={settings.originPostcode} onChange={(e) => setSettings({ ...settings, originPostcode: e.target.value })} /></F>
          <F label="Delivery radius (miles)"><input className="field" type="number" step="0.5" value={settings.radiusMiles} onChange={(e) => setSettings({ ...settings, radiusMiles: Number(e.target.value) })} /></F>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <button onClick={saveSettings} className="btn btn-primary" style={{ padding: "10px 20px", fontSize: 14, borderRadius: 12 }}>Save</button>
          {savedMsg && <span style={{ font: "600 13px Mulish", color: "#4a6b3a" }}>{savedMsg}</span>}
        </div>
      </div>

      {/* Slots */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={sec}>Collection slots</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {slots.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ font: "600 13px Mulish", color: "var(--muted)", width: 60 }}>{s.slotTime}</span>
              <span style={{ font: "500 14px Mulish", color: "var(--ink)", flex: 1 }}>{s.label}</span>
              <button onClick={() => toggleSlot(s)} className="btn" style={{ background: "none", border: "1.5px solid var(--line)", borderRadius: 999, padding: "5px 12px", font: "600 12px Mulish", color: s.active ? "#4a6b3a" : "var(--muted)" }}>
                {s.active ? "Active" : "Off"}
              </button>
              <button onClick={() => removeSlot(s.id)} className="btn" style={{ background: "none", color: "var(--muted)", fontSize: 18 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 8 }}>
          <input className="field" placeholder="09:00" value={newSlot.slotTime} onChange={(e) => setNewSlot({ ...newSlot, slotTime: e.target.value })} />
          <input className="field" placeholder="9:00 – 9:30am" value={newSlot.label} onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })} />
          <button onClick={addSlot} className="btn btn-primary" style={{ padding: "0 18px", fontSize: 13, borderRadius: 12 }}>Add</button>
        </div>
      </div>

      {/* Postcodes */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={sec}>Delivery postcodes</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {postcodes.map((p) => (
            <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--cream-deep)", borderRadius: 999, padding: "6px 12px", font: "600 13px Mulish", color: "var(--ink)" }}>
              {p.prefix}
              <button onClick={() => removePostcode(p.id)} className="btn" style={{ background: "none", color: "var(--muted)", fontSize: 15, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, maxWidth: 320 }}>
          <input className="field" placeholder="HG1" value={newPrefix} onChange={(e) => setNewPrefix(e.target.value)} />
          <button onClick={addPostcode} className="btn btn-primary" style={{ padding: "0 18px", fontSize: 13, borderRadius: 12 }}>Add</button>
        </div>
      </div>
    </div>
  );
}

const sec: React.CSSProperties = { font: "500 18px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 14px" };
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
