import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById, getOrderNotifications } from "@/lib/repos/orders";
import { formatGBP } from "@/lib/money";
import { prettyDate } from "@/lib/dates";
import OrderActions from "@/components/dashboard/OrderActions";
import { StatusBadge, TypeBadge } from "@/components/dashboard/Badges";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(Number(id));
  if (!order) notFound();
  const notifications = await getOrderNotifications(order.id);

  return (
    <div style={{ maxWidth: 820 }}>
      <Link href="/dashboard" style={{ font: "600 13px Mulish", color: "var(--muted)" }}>← Back to queue</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, margin: "14px 0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: 0 }}>{order.orderNumber}</h1>
          <TypeBadge type={order.type} />
          <StatusBadge status={order.status} />
        </div>
        <OrderActions id={order.id} type={order.type} status={order.status} size="md" />
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <Grid>
          <Info label="Customer" value={order.customerName} />
          <Info label="Email" value={order.customerEmail} />
          <Info label="Phone" value={order.customerPhone || "—"} />
          <Info label="Fulfilment" value={order.type === "delivery" ? "Local delivery" : order.type === "contract" ? "Contract" : "Collection"} />
          <Info label="Date" value={order.fulfilmentDate ? prettyDate(order.fulfilmentDate) : "—"} />
          {order.deliveryAddress && <Info label="Address" value={`${order.deliveryAddress}, ${order.deliveryPostcode ?? ""}`} />}
        </Grid>
        {order.notes && (
          <div style={{ marginTop: 14, background: "var(--blush-soft)", color: "var(--accent-deep)", borderRadius: 12, padding: "10px 14px", font: "500 13.5px Mulish" }}>
            ✎ {order.notes}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ font: "500 18px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 12px" }}>Items</h2>
        {order.items.map((i) => (
          <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", font: "500 14px Mulish", color: "#6c5a4a" }}>
            <span>{i.quantity}× {i.nameSnapshot}{i.notes ? ` (${i.notes})` : ""}</span>
            <span>{formatGBP(i.unitPrice * i.quantity)}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, marginLeft: "auto", maxWidth: 260 }}>
          <Line label="Subtotal" value={formatGBP(order.subtotal)} />
          {order.deliveryFee > 0 && <Line label="Delivery" value={formatGBP(order.deliveryFee)} />}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--line)", marginTop: 6, paddingTop: 8, font: "600 18px 'Playfair Display',serif", color: "var(--ink)" }}>
            <span>Total</span>
            <span>{formatGBP(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ font: "500 18px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 12px" }}>Notification history</h2>
        {notifications.length === 0 ? (
          <p style={{ font: "500 13.5px Mulish", color: "var(--muted)", margin: 0 }}>No notifications sent yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notifications.map((n) => (
              <div key={n.id} style={{ display: "flex", justifyContent: "space-between", font: "500 13px Mulish", color: "#6c5a4a", gap: 12 }}>
                <span>
                  <b style={{ textTransform: "capitalize" }}>{n.event.replace("_", " ")}</b> · {n.channel} → {n.recipient}
                </span>
                <span style={{ color: n.status === "sent" ? "#4a6b3a" : n.status === "skipped" ? "var(--muted)" : "var(--danger)" }}>
                  {n.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ font: "600 11px Mulish", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
      <div style={{ font: "500 14.5px Mulish", color: "var(--ink)", marginTop: 3 }}>{value}</div>
    </div>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", font: "500 14px Mulish", color: "#6c5a4a", padding: "3px 0" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
