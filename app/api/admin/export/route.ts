import { getOrdersForExport } from "@/lib/repos/analytics";
import { isoDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

// GET /api/admin/export?from=&to=  → CSV download of orders in range
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to") || isoDate(new Date());
  const from = searchParams.get("from") || isoDate(new Date(Date.now() - 29 * 864e5));

  const rows = await getOrdersForExport(from, to);
  const headers = [
    "order_number", "created_at", "type", "status", "customer_name", "customer_email",
    "fulfilment_date", "subtotal", "delivery_fee", "total", "items",
  ];

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  const csv = lines.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="open-door-orders_${from}_to_${to}.csv"`,
    },
  });
}
