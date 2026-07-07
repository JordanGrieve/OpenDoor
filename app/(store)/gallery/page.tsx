import Link from "next/link";
import type { Metadata } from "next";
import { getProductSummaries } from "@/lib/repos/products";
import { tileBackground } from "@/lib/theme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Pastries, cakes, boxes and flour-dusted moments from the Open Door kitchen in Harrogate.",
};

const HEIGHTS = [260, 360, 230, 300, 250, 280, 300, 240, 250, 270, 230, 290];

export default async function GalleryPage() {
  const products = await getProductSummaries();
  const tiles = products.slice(0, 12);

  return (
    <main className="pbfade wrap" style={{ padding: "56px 24px 90px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <span className="eyebrow">A peek inside</span>
        <h1 style={{ font: "500 clamp(36px,5vw,52px)/1.05 'Playfair Display',serif", color: "var(--ink)", margin: "10px 0 0" }}>Gallery</h1>
        <p style={{ font: "400 16px/1.7 Mulish", color: "#6c5a4a", margin: "12px auto 0", maxWidth: 520 }}>
          Pastries, cakes, boxes and the odd flour-dusted moment from the kitchen.
        </p>
      </div>

      <div style={{ columns: 3, columnGap: 16 }} className="gallery-cols">
        {tiles.map((p, i) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="sheen"
            style={{
              position: "relative",
              display: "block",
              breakInside: "avoid",
              marginBottom: 16,
              borderRadius: 18,
              overflow: "hidden",
              background: tileBackground(p.imageUrl, p.category),
              height: HEIGHTS[i % HEIGHTS.length],
              boxShadow: "0 16px 30px -22px rgba(120,80,40,.5)",
            }}
          >
            <span style={{ position: "absolute", left: 14, bottom: 12, font: "500 12px 'Courier New',monospace", color: "rgba(255,255,255,.9)", letterSpacing: ".05em", zIndex: 1 }}>
              {p.name.toLowerCase()}
            </span>
          </Link>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 46, background: "var(--cream-deep)", borderRadius: 26, padding: 50 }}>
        <h2 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: 0 }}>Seen something you love?</h2>
        <p style={{ font: "400 16px/1.6 Mulish", color: "#6c5a4a", margin: "10px auto 0", maxWidth: 440 }}>
          We can recreate or reinvent almost anything. Tell us what caught your eye.
        </p>
        <Link href="/custom" className="btn btn-primary" style={{ display: "inline-block", marginTop: 22, padding: "14px 30px", fontSize: 15 }}>
          Enquire about a custom order →
        </Link>
      </div>
    </main>
  );
}
