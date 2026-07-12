import Link from "next/link";
import { getProductSummaries } from "@/lib/repos/products";
import { listApprovedReviews } from "@/lib/repos/reviews";
import ProductCard from "@/components/store/ProductCard";
import Newsletter from "@/components/store/Newsletter";
import ShareForm from "@/components/store/ShareForm";
import { tileBackground } from "@/lib/theme";

export const dynamic = "force-dynamic";

const REVIEWS = [
  { name: "Hannah W.", role: "Hamilton", text: "The celebration box for my mum's birthday was unreal. Beautifully boxed and tasted even better than it looked." },
  { name: "Tom & Priya", role: "Collected weekly", text: "We get the morning pastry box most Saturdays now. The almond croissants alone are worth the trip." },
  { name: "Sarah J.", role: "Local delivery", text: "Emma made a dessert table for our wedding and it stole the show. So thoughtful, so generous, so good." },
];

export default async function HomePage() {
  const products = await getProductSummaries();
  const best = products.slice(0, 3);

  // Approved customer reviews (fall back to seed testimonials if none yet)
  const approved = await listApprovedReviews(6);
  const displayReviews =
    approved.length > 0
      ? approved.map((r) => ({ name: r.name, role: "Verified customer", text: r.body, stars: r.rating }))
      : REVIEWS.map((r) => ({ ...r, stars: 5 }));

  // Hero credibility stat — only claim a rating when real reviews exist.
  const reviewCount = approved.length;
  const avgRating =
    reviewCount > 0
      ? (approved.reduce((t, r) => t + r.rating, 0) / reviewCount).toFixed(1)
      : null;

  // category cards with counts
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const categoryCards = categories.slice(0, 8).map((cat) => {
    const items = products.filter((p) => p.category === cat);
    // prefer a product that actually has a photo for the category thumbnail
    const sample = items.find((p) => p.imageUrl) ?? items[0];
    return { label: cat, count: `${items.length} ${items.length === 1 ? "treat" : "treats"}`, sample };
  });

  return (
    <main className="pbfade">
      {/* Hero */}
      <section
        className="grid-2cols"
        style={{
          background: "linear-gradient(135deg,#f6efe3,#efe5d3)",
          padding: "80px 24px",
          minHeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url('https://res.cloudinary.com/pvw2usoi/image/upload/f_auto,q_auto/open-door/hero-home')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.4,
            zIndex: 1,
          }}
        />
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
            {avgRating ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ font: "600 24px 'Playfair Display',serif", color: "var(--ink)" }}>{avgRating} ★</div>
                <div style={{ font: "500 13px Mulish", color: "var(--muted)" }}>
                  {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ font: "600 24px 'Playfair Display',serif", color: "var(--ink)" }}>Hamilton</div>
                <div style={{ font: "500 13px Mulish", color: "var(--muted)" }}>collection &amp; delivery</div>
              </div>
            )}
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
        <div className="grid-cats">
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
        <div className="row-carousel cols-3">
          {best.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* About */}
      <section style={{ background: "var(--cream-deep)", marginTop: 44 }}>
        <div className="wrap grid-2cols sec-pad-lg" style={{ alignItems: "center", gap: 54 }}>
          <div
            role="img"
            aria-label="Emma, the baker behind Open Door"
            style={{
              position: "relative",
              aspectRatio: "4/5",
              borderRadius: 26,
              overflow: "hidden",
              background:
                "#f1d0c9 center/cover no-repeat url('https://res.cloudinary.com/pvw2usoi/image/upload/f_auto,q_auto/open-door/emma-portrait')",
              boxShadow: "0 30px 56px -30px rgba(120,80,40,.5)",
            }}
            className="sheen"
          />
          <div>
            <span className="eyebrow">The hands behind the box</span>
            <h2 style={{ font: "500 clamp(30px,4vw,44px)/1.08 'Playfair Display',serif", color: "var(--ink)", margin: "12px 0 0" }}>
              A little kitchen, a lot of love
            </h2>
            <p style={{ font: "400 16.5px/1.75 Mulish", color: "#6c5a4a", margin: "18px 0 0", maxWidth: 560 }}>
              Emma trained in patisserie in Paris before coming home to Hamilton to bake the things she loves most.
              Everything is made by hand in small batches — laminated dough rested overnight, brownies pulled gooey from
              the oven, cakes finished to order.
            </p>
            <p style={{ font: "500 italic 22px 'Playfair Display',serif", color: "var(--accent-deep)", margin: "22px 0 0" }}>— Emma</p>
          </div>
        </div>
      </section>

      {/* Delivery / Collection */}
      <section className="wrap sec-pad-lg">
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <span className="eyebrow">Getting your box</span>
          <h2 style={{ font: "500 36px/1 'Playfair Display',serif", color: "var(--ink)", margin: "8px 0 0" }}>Collection &amp; local delivery</h2>
        </div>
        <div className="row-carousel cols-2">
          <div className="card" style={{ padding: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--blush-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏡</div>
            <h3 style={{ font: "500 24px 'Playfair Display',serif", color: "var(--ink)", margin: "18px 0 0" }}>Collection</h3>
            <p style={{ font: "400 15px/1.7 Mulish", color: "#6c5a4a", margin: "10px 0 0" }}>
              Collect fresh from our kitchen in Hamilton (ML3), Tuesday to Sunday. We&apos;ll confirm the address with your order.
            </p>
            <div style={{ font: "600 13px Mulish", color: "var(--accent-deep)", marginTop: 14 }}>Always free</div>
          </div>
          <div className="card" style={{ padding: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--blush-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🚲</div>
            <h3 style={{ font: "500 24px 'Playfair Display',serif", color: "var(--ink)", margin: "18px 0 0" }}>Local delivery</h3>
            <p style={{ font: "400 15px/1.7 Mulish", color: "#6c5a4a", margin: "10px 0 0" }}>
              We deliver within about 8 miles of Hamilton — Motherwell, Bothwell, Blantyre, East Kilbride &amp; more. Order before 4pm for next-day.
            </p>
            <div style={{ font: "600 13px Mulish", color: "var(--accent-deep)", marginTop: 14 }}>Free over £40 · otherwise £4.50</div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section style={{ background: "var(--cream-deep)" }}>
        <div className="wrap sec-pad-lg">
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <span className="eyebrow">Kind words</span>
            <h2 style={{ font: "500 36px/1 'Playfair Display',serif", color: "var(--ink)", margin: "8px 0 0" }}>What locals say</h2>
          </div>
          <div className="row-carousel cols-3">
            {displayReviews.map((r) => (
              <div key={r.name} className="card" style={{ padding: 28 }}>
                <div style={{ color: "var(--accent)", fontSize: 15, letterSpacing: 2 }}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</div>
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
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <ShareForm
              kind="review"
              withRating
              buttonLabel="Leave a review"
              heading="Leave a review"
              blurb="Ordered from us? We'd love to hear how it went."
              messagePlaceholder="Tell us what you thought…"
            />
          </div>
        </div>
      </section>

      <Newsletter />
    </main>
  );
}
