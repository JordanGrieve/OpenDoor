export const dynamic = "force-dynamic";

export default function StockPlaceholder() {
  return (
    <div>
      <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)" }}>Stock &amp; shopping</h1>
      <div className="card" style={{ padding: 32, marginTop: 16, color: "var(--muted)", font: "500 15px Mulish" }}>
        Ingredient stock and the auto-calculated shopping list are being built next.
      </div>
    </div>
  );
}
