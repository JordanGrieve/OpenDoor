"use client";
import { useCallback, useEffect, useState } from "react";
import type { Analytics } from "@/lib/repos/analytics";
import { formatGBP } from "@/lib/money";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AnalyticsPage() {
  const [from, setFrom] = useState(iso(new Date(Date.now() - 29 * 864e5)));
  const [to, setTo] = useState(iso(new Date()));
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch(`/api/admin/analytics?from=${from}&to=${to}`).then((r) => r.json());
    setData(d);
    setLoading(false);
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const maxDay = data ? Math.max(1, ...data.dailyRevenue.map((d) => d.retail + d.b2b)) : 1;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: 0 }}>Analytics</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={dateInput} />
          <span style={{ color: "var(--muted)" }}>→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={dateInput} />
          <a href={`/api/admin/export?from=${from}&to=${to}`} className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 13, borderRadius: 10 }}>
            Export CSV
          </a>
        </div>
      </div>

      {loading || !data ? (
        <div style={{ color: "var(--muted)", font: "500 15px Mulish" }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
            <Stat label="Retail revenue" value={formatGBP(data.totals.retail)} />
            <Stat label="B2B revenue" value={formatGBP(data.totals.b2b)} />
            <Stat label="Orders" value={String(data.totals.orders)} />
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h2 style={sec}>Daily revenue (retail vs B2B)</h2>
            {data.dailyRevenue.length === 0 ? (
              <p style={{ color: "var(--muted)", font: "500 14px Mulish" }}>No revenue in this range.</p>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 180, overflowX: "auto", paddingTop: 8 }}>
                {data.dailyRevenue.map((d) => {
                  const h = ((d.retail + d.b2b) / maxDay) * 150;
                  const retailH = (d.retail / (d.retail + d.b2b || 1)) * h;
                  return (
                    <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 26 }} title={`${d.day}: retail ${formatGBP(d.retail)}, B2B ${formatGBP(d.b2b)}`}>
                      <div style={{ width: 18, height: h, display: "flex", flexDirection: "column", justifyContent: "flex-end", borderRadius: 4, overflow: "hidden", background: "var(--cream-deep)" }}>
                        <div style={{ height: h - retailH, background: "var(--accent-deep)" }} />
                        <div style={{ height: retailH, background: "var(--accent)" }} />
                      </div>
                      <span style={{ font: "500 9px Mulish", color: "var(--muted)", transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{d.day.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: 16, marginTop: 12, font: "500 12px Mulish", color: "var(--muted)" }}>
              <Legend color="var(--accent)" label="Retail" />
              <Legend color="var(--accent-deep)" label="B2B" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="grid-2cols">
            <div className="card" style={{ padding: 24 }}>
              <h2 style={sec}>Bestsellers</h2>
              {data.bestsellers.length === 0 ? <Empty /> : data.bestsellers.map((b) => (
                <div key={b.name} style={rowStyle}>
                  <span>{b.name}</span>
                  <span><b>{b.qty}</b> <span style={{ color: "var(--muted)" }}>· {formatGBP(b.revenue)}</span></span>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 24 }}>
              <h2 style={sec}>Busiest collection slots</h2>
              {data.busiestSlots.length === 0 ? <Empty /> : data.busiestSlots.map((s) => (
                <div key={s.label} style={rowStyle}>
                  <span>{s.label}</span>
                  <span><b>{s.orders}</b> orders</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const sec: React.CSSProperties = { font: "500 18px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 14px" };
const dateInput: React.CSSProperties = { padding: "8px 10px", border: "1.5px solid var(--line)", borderRadius: 10, font: "500 13px Mulish", color: "var(--ink)" };
const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", font: "500 14px Mulish", color: "#6c5a4a" };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ font: "600 11px Mulish", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
      <div style={{ font: "500 28px 'Playfair Display',serif", color: "var(--ink)", marginTop: 4 }}>{value}</div>
    </div>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: color }} /> {label}
    </span>
  );
}
function Empty() {
  return <p style={{ color: "var(--muted)", font: "500 14px Mulish", margin: 0 }}>No data in this range.</p>;
}
