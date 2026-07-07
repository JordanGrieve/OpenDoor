export const dynamic = "force-dynamic";

export default function SettingsPlaceholder() {
  return (
    <div>
      <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)" }}>Settings</h1>
      <div className="card" style={{ padding: 32, marginTop: 16, color: "var(--muted)", font: "500 15px Mulish" }}>
        Delivery fee/threshold, radius &amp; postcodes, collection slots and origin address are being built next.
      </div>
    </div>
  );
}
