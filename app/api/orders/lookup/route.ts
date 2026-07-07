import { NextResponse } from "next/server";
import { getOrderByNumberAndEmail } from "@/lib/repos/orders";
import { isCancellable } from "@/lib/orders-policy";

export const dynamic = "force-dynamic";

// GET /api/orders/lookup?number=ORD-0084&email=...
// Guest order lookup — requires BOTH the order number and matching email.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const number = searchParams.get("number") ?? "";
    const email = searchParams.get("email") ?? "";
    if (!number || !email) {
      return NextResponse.json({ error: "Order number and email are required." }, { status: 400 });
    }
    const order = await getOrderByNumberAndEmail(number, email);
    if (!order) return NextResponse.json({ error: "No matching order found." }, { status: 404 });

    const cancellable = isCancellable(order.status, order.createdAt);
    return NextResponse.json({ order, cancellable });
  } catch (err) {
    console.error("[api/orders/lookup]", err);
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }
}
