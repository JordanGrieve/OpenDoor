export const dynamic = "force-dynamic";

export default function AnalyticsPlaceholder() {
  return (
    <div>
      <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)" }}>Analytics</h1>
      <div className="card" style={{ padding: 32, marginTop: 16, color: "var(--muted)", font: "500 15px Mulish" }}>
        Daily revenue (retail vs B2B), bestsellers, busiest slots and CSV export are being built next.
      </div>
    </div>
  );
}
