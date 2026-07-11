import Link from "next/link";
import { listOrders, purgeStalePendingOrders, type AdminOrder } from "@/lib/repos/orders";
import { formatGBP } from "@/lib/money";
import { prettyDate } from "@/lib/dates";
import OrderActions from "@/components/dashboard/OrderActions";
import { StatusBadge, TypeBadge } from "@/components/dashboard/Badges";

export const dynamic = "force-dynamic";

const VIEWS: Record<string, (o: AdminOrder) => boolean> = {
  active: (o) => ["pending", "confirmed", "ready"].includes(o.status),
  ready: (o) => o.status === "ready",
  completed: (o) => ["collected", "dispatched"].includes(o.status),
  cancelled: (o) => ["cancelled", "refunded"].includes(o.status),
  all: () => true,
};

export default async function OrderQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view = "active" } = await searchParams;
  await purgeStalePendingOrders().catch(() => {}); // tidy abandoned checkouts
  const all = await listOrders({});
  const filtered = all.filter(VIEWS[view] ?? VIEWS.active);

  // group by fulfilment date
  const groups = new Map<string, AdminOrder[]>();
  for (const o of filtered) {
    const key = o.fulfilmentDate || "No date";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(o);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: 0 }}>Order queue</h1>
        <Link href="/dashboard/orders/b2b" className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 13 }}>
          + Log B2B order
        </Link>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {Object.keys(VIEWS).map((v) => (
          <Link
            key={v}
            href={`/dashboard?view=${v}`}
            style={{
              padding: "7px 14px",
              borderRadius: 999,
              font: "600 13px Mulish",
              textTransform: "capitalize",
              background: v === view ? "var(--ink)" : "var(--card)",
              color: v === view ? "#fbf3e6" : "var(--muted)",
              border: "1px solid var(--line)",
            }}
          >
            {v} {v === view ? `(${filtered.length})` : ""}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted)", font: "500 15px Mulish" }}>
          No orders in this view.
        </div>
      ) : (
        [...groups.entries()].map(([date, orders]) => (
          <section key={date} style={{ marginBottom: 28 }}>
            <h2 style={{ font: "600 13px Mulish", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--accent-deep)", marginBottom: 12 }}>
              {date === "No date" ? "No date set" : prettyDate(date)} · {orders.length} order{orders.length === 1 ? "" : "s"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map((o) => (
                <div key={o.id} className="card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 200, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <Link href={`/dashboard/orders/${o.id}`} style={{ font: "600 16px 'Playfair Display',serif", color: "var(--ink)" }}>
                          {o.orderNumber}
                        </Link>
                        <TypeBadge type={o.type} />
                        <StatusBadge status={o.status} />
                        {o.slotLabel && <span style={{ font: "500 12px Mulish", color: "var(--muted)" }}>{o.slotLabel}</span>}
                      </div>
                      <div style={{ font: "500 13.5px Mulish", color: "var(--ink)", marginTop: 6 }}>
                        {o.customerName} · {o.customerPhone || o.customerEmail}
                      </div>
                      <div style={{ font: "400 13px Mulish", color: "#6c5a4a", marginTop: 4 }}>
                        {o.items.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(", ")}
                      </div>
                      {o.notes && <div style={{ font: "400 12.5px Mulish", color: "var(--accent-deep)", marginTop: 4 }}>✎ {o.notes}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ font: "600 18px 'Playfair Display',serif", color: "var(--ink)" }}>{formatGBP(o.total)}</div>
                      <div style={{ marginTop: 10 }}>
                        <OrderActions id={o.id} type={o.type} status={o.status} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
