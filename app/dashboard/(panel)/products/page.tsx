import Link from "next/link";
import { listAllProducts } from "@/lib/repos/products-admin";
import { formatGBP } from "@/lib/money";
import { categoryGradient } from "@/lib/theme";
import ArchiveToggle from "@/components/dashboard/ArchiveToggle";

export const dynamic = "force-dynamic";

export default async function ProductsListPage() {
  const products = await listAllProducts();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: 0 }}>Products</h1>
        <Link href="/dashboard/products/new" className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 13 }}>
          + New product
        </Link>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {products.length === 0 ? (
          <div style={{ padding: 32, color: "var(--muted)", font: "500 15px Mulish" }}>No products yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", font: "500 14px Mulish" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)", font: "600 11px Mulish", letterSpacing: ".06em", textTransform: "uppercase" }}>
                <th style={th}>Product</th>
                <th style={th}>Category</th>
                <th style={th}>Price</th>
                <th style={th}>Lead</th>
                <th style={th}>Variants</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--line)", opacity: p.archived ? 0.5 : 1 }}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          flexShrink: 0,
                          overflow: "hidden",
                          display: "block",
                          background: p.imageUrl ? "var(--cream-deep)" : categoryGradient(p.category),
                        }}
                      >
                        {p.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        )}
                      </span>
                      <span>
                        <Link href={`/dashboard/products/${p.id}`} style={{ color: "var(--ink)", fontWeight: 600 }}>
                          {p.name}
                        </Link>
                        {p.archived && <span style={{ marginLeft: 8, font: "600 10px Mulish", color: "var(--danger)" }}>ARCHIVED</span>}
                      </span>
                    </div>
                  </td>
                  <td style={td}>{p.category}</td>
                  <td style={td}>{formatGBP(p.price)}</td>
                  <td style={td}>{p.leadTimeDays}d</td>
                  <td style={td}>{p.variantCount}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <ArchiveToggle id={p.id} archived={p.archived} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: "14px 18px" };
const td: React.CSSProperties = { padding: "14px 18px", color: "#6c5a4a" };
