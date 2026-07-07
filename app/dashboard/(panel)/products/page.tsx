export const dynamic = "force-dynamic";

export default function ProductsPlaceholder() {
  return (
    <div>
      <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)" }}>Products</h1>
      <div className="card" style={{ padding: 32, marginTop: 16, color: "var(--muted)", font: "500 15px Mulish" }}>
        Full product CRUD (images, variants, recipes, allergens, SEO, availability) is being built next.
      </div>
    </div>
  );
}
