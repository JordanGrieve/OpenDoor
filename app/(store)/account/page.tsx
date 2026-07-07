import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { clerkEnabled } from "@/lib/clerk";
import { getAccountOrders } from "@/lib/repos/orders";
import { formatGBP } from "@/lib/money";
import { prettyDate } from "@/lib/dates";
import { StatusBadge, TypeBadge } from "@/components/dashboard/Badges";
import ReorderButton from "@/components/store/ReorderButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  // Accounts are optional — without Clerk, use the guest order lookup.
  if (!clerkEnabled) redirect("/orders");

  const user = await currentUser();
  if (!user) {
    return (
      <main className="pbfade wrap" style={{ padding: "80px 24px", maxWidth: 560, textAlign: "center" }}>
        <h1 style={{ font: "500 32px 'Playfair Display',serif", color: "var(--ink)" }}>Sign in to see your orders</h1>
        <p style={{ font: "400 15px Mulish", color: "#6c5a4a", marginTop: 10 }}>Use the Sign in button in the header.</p>
      </main>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || "";
  const orders = email ? await getAccountOrders(email) : [];

  return (
    <main className="pbfade wrap" style={{ padding: "56px 24px 90px", maxWidth: 820 }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow">Your account</span>
        <h1 style={{ font: "500 clamp(32px,4.6vw,46px)/1.05 'Playfair Display',serif", color: "var(--ink)", margin: "10px 0 0" }}>Order history</h1>
        <p style={{ font: "400 15px Mulish", color: "#6c5a4a", marginTop: 8 }}>Signed in as {email}</p>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <p style={{ font: "500 15px Mulish", color: "var(--muted)", margin: 0 }}>No orders yet.</p>
          <Link href="/shop" className="btn btn-primary" style={{ display: "inline-block", marginTop: 16, padding: "12px 24px", fontSize: 14 }}>
            Start shopping →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.map((o) => (
            <div key={o.id} className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ font: "600 16px 'Playfair Display',serif", color: "var(--ink)" }}>{o.orderNumber}</span>
                  <TypeBadge type={o.type} />
                  <StatusBadge status={o.status} />
                  <span style={{ font: "500 12px Mulish", color: "var(--muted)" }}>{prettyDate(o.createdAt.slice(0, 10))}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ font: "600 17px 'Playfair Display',serif", color: "var(--ink)" }}>{formatGBP(o.total)}</span>
                  <ReorderButton items={o.reorderItems} />
                </div>
              </div>
              <div style={{ font: "400 13.5px Mulish", color: "#6c5a4a", marginTop: 8 }}>
                {o.lines.map((l) => `${l.quantity}× ${l.name}`).join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
