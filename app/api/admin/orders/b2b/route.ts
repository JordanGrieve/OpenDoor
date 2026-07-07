import { NextResponse } from "next/server";
import { createManualOrder, type ManualOrderInput } from "@/lib/repos/orders";

export const dynamic = "force-dynamic";

// POST /api/admin/orders/b2b — log a contract order (no Stripe, invoice)
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ManualOrderInput;
    if (!body.customer?.name?.trim()) return NextResponse.json({ error: "Business/customer name required" }, { status: 400 });
    if (!body.items?.length) return NextResponse.json({ error: "Add at least one line item" }, { status: 400 });
    const clean = {
      ...body,
      customer: { ...body.customer, email: body.customer.email || "" },
      items: body.items
        .filter((i) => i.name?.trim() && i.quantity > 0)
        .map((i) => ({ ...i, unitPrice: Number(i.unitPrice) || 0, quantity: Number(i.quantity) })),
    };
    const result = await createManualOrder(clean);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin/orders/b2b]", err);
    return NextResponse.json({ error: (err as Error).message || "Failed to create order" }, { status: 500 });
  }
}
