import { listIngredients } from "@/lib/repos/products-admin";
import { getShoppingList } from "@/lib/repos/stock";
import IngredientRow from "@/components/dashboard/IngredientRow";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const [ingredients, groups] = await Promise.all([listIngredients(), getShoppingList()]);

  // group ingredients by category
  const byCat = new Map<string, typeof ingredients>();
  for (const i of ingredients) {
    if (!byCat.has(i.category)) byCat.set(i.category, []);
    byCat.get(i.category)!.push(i);
  }

  return (
    <div>
      <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 20px" }}>Stock &amp; shopping</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }} className="grid-2cols">
        {/* Ingredient stock */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ font: "500 18px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 8px" }}>Ingredient stock</h2>
          <p style={{ font: "400 12.5px Mulish", color: "var(--muted)", margin: "0 0 12px" }}>Edit a value and click away to save.</p>
          {[...byCat.entries()].map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ font: "600 11px Mulish", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--accent-deep)", marginBottom: 4 }}>{cat}</div>
              {items.map((i) => (
                <IngredientRow key={i.id} id={i.id} name={i.name} unit={i.unit} category={i.category} stock={i.stock} />
              ))}
            </div>
          ))}
        </div>

        {/* Shopping list */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ font: "500 18px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 8px" }}>Shopping list</h2>
          <p style={{ font: "400 12.5px Mulish", color: "var(--muted)", margin: "0 0 12px" }}>
            What to buy for outstanding (paid, unbaked) orders — required minus current stock.
          </p>
          {groups.length === 0 ? (
            <p style={{ font: "500 14px Mulish", color: "var(--muted)" }}>Nothing to buy right now.</p>
          ) : (
            groups.map((g) => (
              <div key={g.category} style={{ marginBottom: 16 }}>
                <div style={{ font: "600 11px Mulish", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--accent-deep)", marginBottom: 6 }}>{g.category}</div>
                {g.lines.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)", font: "500 13.5px Mulish", color: "#6c5a4a" }}>
                    <span>{l.name}</span>
                    <span>
                      <b style={{ color: l.toBuy > 0 ? "var(--danger)" : "#4a6b3a" }}>{l.toBuy > 0 ? `buy ${l.toBuy}${l.unit}` : "in stock"}</b>
                      <span style={{ color: "var(--muted)", marginLeft: 8 }}>need {l.required}{l.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
