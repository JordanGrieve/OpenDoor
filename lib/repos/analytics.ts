// Analytics + CSV export data. Revenue counts paid orders only
// (excludes pending / cancelled / refunded).
import { sql } from "@/lib/db";
import { num } from "@/lib/money";

type Row = Record<string, unknown>;

const PAID = "status NOT IN ('cancelled','refunded','pending')";

export interface Analytics {
  from: string;
  to: string;
  totals: { retail: number; b2b: number; orders: number };
  dailyRevenue: { day: string; retail: number; b2b: number }[];
  bestsellers: { name: string; qty: number; revenue: number }[];
  busiestSlots: { label: string; orders: number }[];
}

export async function getAnalytics(from: string, to: string): Promise<Analytics> {
  const daily = (await sql`
    SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day,
           SUM(CASE WHEN type = 'contract' THEN total ELSE 0 END) AS b2b,
           SUM(CASE WHEN type IN ('collection','delivery') THEN total ELSE 0 END) AS retail
    FROM orders
    WHERE status NOT IN ('cancelled','refunded','pending')
      AND created_at::date BETWEEN ${from} AND ${to}
    GROUP BY 1 ORDER BY 1
  `) as Row[];

  const best = (await sql`
    SELECT oi.name_snapshot AS name, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.unit_price) AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status NOT IN ('cancelled','refunded','pending')
      AND o.created_at::date BETWEEN ${from} AND ${to}
    GROUP BY oi.name_snapshot ORDER BY qty DESC LIMIT 10
  `) as Row[];

  const slots = (await sql`
    SELECT cs.label, COUNT(*) AS orders
    FROM orders o JOIN collection_slots cs ON cs.id = o.collection_slot_id
    WHERE o.status NOT IN ('cancelled','refunded','pending')
      AND o.created_at::date BETWEEN ${from} AND ${to}
    GROUP BY cs.label ORDER BY orders DESC
  `) as Row[];

  const dailyRevenue = daily.map((r) => ({ day: String(r.day), retail: num(r.retail), b2b: num(r.b2b) }));
  const totals = {
    retail: dailyRevenue.reduce((t, d) => t + d.retail, 0),
    b2b: dailyRevenue.reduce((t, d) => t + d.b2b, 0),
    orders: 0,
  };
  const countRows = (await sql`
    SELECT COUNT(*) AS n FROM orders
    WHERE status NOT IN ('cancelled','refunded','pending') AND created_at::date BETWEEN ${from} AND ${to}
  `) as Row[];
  totals.orders = Number(countRows[0].n);

  return {
    from,
    to,
    totals,
    dailyRevenue,
    bestsellers: best.map((r) => ({ name: String(r.name), qty: Number(r.qty), revenue: num(r.revenue) })),
    busiestSlots: slots.map((r) => ({ label: String(r.label), orders: Number(r.orders) })),
  };
}

/** Flat rows for CSV export. */
export async function getOrdersForExport(from: string, to: string): Promise<Row[]> {
  return (await sql`
    SELECT o.order_number, o.created_at, o.type, o.status, o.customer_name, o.customer_email,
           o.fulfilment_date, o.subtotal, o.delivery_fee, o.total,
           (SELECT string_agg(oi.quantity || 'x ' || oi.name_snapshot, ' | ') FROM order_items oi WHERE oi.order_id = o.id) AS items
    FROM orders o
    WHERE o.created_at::date BETWEEN ${from} AND ${to}
    ORDER BY o.created_at
  `) as Row[];
}
