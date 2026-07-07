import Link from "next/link";
import { getProductSummaries } from "@/lib/repos/products";
import ProductCard from "@/components/store/ProductCard";
import Newsletter from "@/components/store/Newsletter";
import { tileBackground } from "@/lib/theme";

export const dynamic = "force-dynamic";

const REVIEWS = [
  { name: "Hannah W.", role: "Harrogate", text: "The celebration box for my mum's birthday was unreal. Beautifully boxed and tasted even better than it looked." },
  { name: "Tom & Priya", role: "Collected weekly", text: "We get the morning pastry box most Saturdays now. The almond croissants alone are worth the trip." },
  { name: "Sarah J.", role: "Local delivery", text: "Emma made a dessert table for our wedding and it stole the show. So thoughtful, so generous, so good." },
];

export default async function HomePage() {
  const products = await getProductSummaries();
  const best = products.slice(0, 3);

  // category cards with counts
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const categoryCards = categories.slice(0, 8).map((cat) => {
    const items = products.filter((p) => p.category === cat);
    return { label: cat, count: `${items.length} ${items.length === 1 ? "treat" : "treats"}`, sample: items[0] };
  });

  return (
    <main className="pbfade">
      {/* Hero */}
      <section
        className="grid-2cols"
        style={{
          background: "linear-gradient(135deg,#f6efe3,#efe5d3)",
          padding: "120px 24px",
          minHeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "relative", zIndex: 2, maxWidth: 620, textAlign: "center" }}>
          <h1 style={{ font: "500 clamp(48px,7vw,72px)/1 'Playfair Display',serif", letterSpacing: "-.02em", color: "var(--ink)", margin: 0 }}>
            Welcome to
            <br />
            Open Door Bakery
          </h1>
          <p style={{ font: "400 18px/1.7 Mulish", color: "#6c5a4a", margin: "24px 0 0" }}>
            Fresh handmade pastries, cakes, brownies, tarts and celebration boxes — baked with care and love.
            Collection and local delivery available daily.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/shop" className="btn btn-primary" style={{ padding: "15px 32px", fontSize: 15 }}>
              Shop Now →
            </Link>
            <Link href="/custom" className="btn btn-outline" style={{ padding: "15px 28px", fontSize: 15 }}>
              Custom Orders
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, marginTop: 32 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ font: "600 24px 'Playfair Display',serif", color: "var(--ink)" }}>4.9 ★</div>
              <div style={{ font: "500 13px Mulish", color: "var(--muted)" }}>600+ orders</div>
            </div>
            <div style={{ width: 1, height: 40, background: "var(--line)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ font: "600 24px 'Playfair Display',serif", color: "var(--ink)" }}>Baked daily</div>
              <div style={{ font: "500 13px Mulish", color: "var(--muted)" }}>6am, by hand</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="wrap" style={{ padding: "44px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 26 }}>
          <div>
            <span className="eyebrow">Browse the counter</span>
            <h2 style={{ font: "500 34px/1 'Playfair Display',serif", color: "var(--ink)", margin: "8px 0 0" }}>Shop by category</h2>
          </div>
          <Link href="/shop" style={{ font: "600 14px Mulish", color: "var(--accent-deep)" }}>View all →</Link>
        </div>
        <div className="grid-4cols">
          {categoryCards.map((c) => (
            <Link
              key={c.label}
              href={`/shop?category=${encodeURIComponent(c.label)}`}
              className="card"
              style={{ overflow: "hidden", display: "block" }}
            >
              <div className="sheen" style={{ position: "relative", height: 120, background: tileBackground(c.sample?.imageUrl ?? null, c.label) }} />
              <div style={{ padding: "14px 16px" }}>
                <div style={{ font: "600 16px 'Playfair Display',serif", color: "var(--ink)" }}>{c.label}</div>
                <div style={{ font: "500 12px Mulish", color: "var(--muted)", marginTop: 2 }}>{c.count}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="wrap" style={{ padding: "44px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <span className="eyebrow">Loved by locals</span>
          <h2 style={{ font: "500 36px/1 'Playfair Display',serif", color: "var(--ink)", margin: "8px 0 0" }}>Bestselling boxes</h2>
        </div>
        <div className="grid-3cols">
          {best.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* About */}
      <section style={{ background: "var(--cream-deep)", marginTop: 44 }}>
        <div className="wrap grid-2cols" style={{ padding: "80px 24px", alignItems: "center", gap: 54 }}>
          <div style={{ position: "relative", aspectRatio: "4/5", borderRadius: 26, overflow: "hidden", background: "linear-gradient(150deg,#f1d0c9,#cf9a8f)", boxShadow: "0 30px 56px -30px rgba(120,80,40,.5)" }} className="sheen" />
          <div>
            <span className="eyebrow">The hands behind the box</span>
            <h2 style={{ font: "500 clamp(30px,4vw,44px)/1.08 'Playfair Display',serif", color: "var(--ink)", margin: "12px 0 0" }}>
              A little kitchen, a lot of love
            </h2>
            <p style={{ font: "400 16.5px/1.75 Mulish", color: "#6c5a4a", margin: "18px 0 0", maxWidth: 560 }}>
              Emma trained in patisserie in Paris before coming home to Harrogate to bake the things she loves most.
              Everything is made by hand in small batches — laminated dough rested overnight, brownies pulled gooey from
              the oven, cakes finished to order.
            </p>
            <p style={{ font: "500 italic 22px 'Playfair Display',serif", color: "var(--accent-deep)", margin: "22px 0 0" }}>— Emma</p>
          </div>
        </div>
      </section>

      {/* Delivery / Collection */}
      <section className="wrap" style={{ padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <span className="eyebrow">Getting your box</span>
          <h2 style={{ font: "500 36px/1 'Playfair Display',serif", color: "var(--ink)", margin: "8px 0 0" }}>Collection &amp; local delivery</h2>
        </div>
        <div className="grid-2cols">
          <div className="card" style={{ padding: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--blush-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏡</div>
            <h3 style={{ font: "500 24px 'Playfair Display',serif", color: "var(--ink)", margin: "18px 0 0" }}>Collection</h3>
            <p style={{ font: "400 15px/1.7 Mulish", color: "#6c5a4a", margin: "10px 0 0" }}>
              Collect fresh from our kitchen door in central Harrogate, Tuesday to Sunday, 8am–2pm.
            </p>
            <div style={{ font: "600 13px Mulish", color: "var(--accent-deep)", marginTop: 14 }}>Always free</div>
          </div>
          <div className="card" style={{ padding: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--blush-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🚲</div>
            <h3 style={{ font: "500 24px 'Playfair Display',serif", color: "var(--ink)", margin: "18px 0 0" }}>Local delivery</h3>
            <p style={{ font: "400 15px/1.7 Mulish", color: "#6c5a4a", margin: "10px 0 0" }}>
              We deliver within 8 miles of Harrogate. Order before 4pm for next-day delivery.
            </p>
            <div style={{ font: "600 13px Mulish", color: "var(--accent-deep)", marginTop: 14 }}>Free over £40 · otherwise £4.50</div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section style={{ background: "var(--cream-deep)" }}>
        <div className="wrap" style={{ padding: "80px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <span className="eyebrow">Kind words</span>
            <h2 style={{ font: "500 36px/1 'Playfair Display',serif", color: "var(--ink)", margin: "8px 0 0" }}>What locals say</h2>
          </div>
          <div className="grid-3cols">
            {REVIEWS.map((r) => (
              <div key={r.name} className="card" style={{ padding: 28 }}>
                <div style={{ color: "var(--accent)", fontSize: 15, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ font: "400 16px/1.7 'Playfair Display',serif", fontStyle: "italic", color: "var(--ink)", margin: "14px 0 0" }}>
                  “{r.text}”
                </p>
                <div style={{ marginTop: 18 }}>
                  <div style={{ font: "600 14px Mulish", color: "var(--ink)" }}>{r.name}</div>
                  <div style={{ font: "500 12px Mulish", color: "var(--muted)" }}>{r.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </main>
  );
}
