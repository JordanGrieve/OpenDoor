import { NextResponse } from "next/server";
import { getOrderByNumberAndEmail } from "@/lib/repos/orders";
import { isCancellable } from "@/lib/orders-policy";
import { rateLimitGuard } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/orders/lookup?number=ORD-0084&email=...
// Guest order lookup — requires BOTH the order number and matching email.
// Rate limited: this is the one read endpoint that's an enumeration surface.
export async function GET(req: Request) {
  const limited = rateLimitGuard(req, "orderLookup", "Too many lookups — please wait a moment and try again.");
  if (limited) return limited;
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
