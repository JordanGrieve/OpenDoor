// ─────────────────────────────────────────────────────────────
// Order data access. Prices are ALWAYS recomputed from the DB —
// the client's cart prices are never trusted.
// ─────────────────────────────────────────────────────────────
import { sql } from "@/lib/db";
import { num } from "@/lib/money";
import { getDeliverySettings } from "@/lib/repos/store";
import type { CheckoutRequest, Order, OrderItem, OrderStatus } from "@/lib/types";

type Row = Record<string, unknown>;

export interface PricedItem {
  productId: number;
  variantId: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  leadTimeDays: number;
  celebration: boolean;
}

export interface PricedCart {
  items: PricedItem[];
  subtotal: number;
  longestLeadDays: number;
  hasCelebration: boolean;
}

/** Validate + price a cart against the DB. Throws on any invalid line. */
export async function priceCheckout(
  lines: CheckoutRequest["items"]
): Promise<PricedCart> {
  if (!lines || lines.length === 0) throw new Error("Your cart is empty.");

  const priced: PricedItem[] = [];
  for (const line of lines) {
    if (!line.productId || !line.quantity || line.quantity < 1) {
      throw new Error("Invalid cart line.");
    }
    const rows = (await sql`
      SELECT p.id AS product_id, p.name, p.price AS product_price,
             p.lead_time_days, p.celebration, p.archived,
             v.id AS variant_id, v.label AS variant_label, v.price AS variant_price
      FROM products p
      LEFT JOIN product_variants v ON v.id = ${line.variantId ?? null} AND v.product_id = p.id
      WHERE p.id = ${line.productId}
      LIMIT 1
    `) as Row[];
    const r = rows[0];
    if (!r || r.archived) throw new Error("A product in your cart is no longer available.");

    const usingVariant = line.variantId != null && r.variant_id != null;
    const unitPrice = usingVariant ? num(r.variant_price) : num(r.product_price);
    const name = usingVariant ? `${r.name} · ${r.variant_label}` : String(r.name);

    priced.push({
      productId: Number(r.product_id),
      variantId: usingVariant ? Number(r.variant_id) : null,
      name,
      quantity: line.quantity,
      unitPrice,
      notes: line.notes?.trim() || null,
      leadTimeDays: Number(r.lead_time_days),
      celebration: Boolean(r.celebration),
    });
  }

  const subtotal = priced.reduce((t, i) => t + i.unitPrice * i.quantity, 0);
  const longestLeadDays = priced.reduce((m, i) => Math.max(m, i.leadTimeDays), 0);
  const hasCelebration = priced.some((i) => i.celebration);
  return { items: priced, subtotal: round2(subtotal), longestLeadDays, hasCelebration };
}

/** Delivery fee given a subtotal (0 for collection or over the free threshold). */
export async function computeDeliveryFee(fulfilment: "collection" | "delivery", subtotal: number) {
  if (fulfilment !== "delivery") return 0;
  const s = await getDeliverySettings();
  return subtotal >= s.freeDeliveryMin ? 0 : round2(s.deliveryFee);
}

export interface CreateOrderInput {
  type: "collection" | "delivery" | "contract";
  status?: OrderStatus;
  customer: { name: string; email: string; phone?: string | null };
  customerId?: number | null;
  cart: PricedCart;
  deliveryFee: number;
  collectionSlotId?: number | null;
  fulfilmentDate?: string | null;
  deliveryAddress?: string | null;
  deliveryPostcode?: string | null;
  notes?: string | null;
  notifications?: { email: boolean; sms: boolean };
}

/** Create an order + items + notification prefs. Returns id/number/total. */
export async function createOrder(input: CreateOrderInput): Promise<{ id: number; orderNumber: string; total: number }> {
  const total = round2(input.cart.subtotal + input.deliveryFee);
  const status = input.status ?? "pending";

  const orderRows = (await sql`
    INSERT INTO orders (
      type, status, customer_id, customer_name, customer_email, customer_phone,
      delivery_address, delivery_postcode, collection_slot_id, fulfilment_date, notes,
      subtotal, delivery_fee, total
    ) VALUES (
      ${input.type}, ${status}, ${input.customerId ?? null},
      ${input.customer.name}, ${input.customer.email}, ${input.customer.phone ?? null},
      ${input.deliveryAddress ?? null}, ${input.deliveryPostcode ?? null},
      ${input.collectionSlotId ?? null}, ${input.fulfilmentDate ?? null}, ${input.notes ?? null},
      ${input.cart.subtotal}, ${input.deliveryFee}, ${total}
    )
    RETURNING id, order_number
  `) as Row[];

  const id = Number(orderRows[0].id);
  const orderNumber = String(orderRows[0].order_number);

  for (const it of input.cart.items) {
    await sql`
      INSERT INTO order_items (order_id, product_id, variant_id, name_snapshot, quantity, unit_price, notes)
      VALUES (${id}, ${it.productId}, ${it.variantId}, ${it.name}, ${it.quantity}, ${it.unitPrice}, ${it.notes})
    `;
  }

  const prefs = input.notifications ?? { email: true, sms: false };
  await sql`
    INSERT INTO notification_prefs (order_id, email_opt_in, sms_opt_in)
    VALUES (${id}, ${prefs.email}, ${prefs.sms})
    ON CONFLICT (order_id) DO UPDATE SET email_opt_in = ${prefs.email}, sms_opt_in = ${prefs.sms}
  `;

  return { id, orderNumber, total };
}

export async function attachStripeSession(orderId: number, sessionId: string) {
  await sql`UPDATE orders SET stripe_session_id = ${sessionId}, updated_at = now() WHERE id = ${orderId}`;
}

/**
 * Mark paid: confirm + record payment + decrement daily stock.
 * Idempotent — `transitioned` is true only for the call that actually
 * moved the order out of `pending` (so notifications fire exactly once).
 */
export async function confirmOrderBySession(
  sessionId: string,
  paymentId: string | null
): Promise<{ order: Order | null; transitioned: boolean }> {
  const rows = (await sql`SELECT id, status FROM orders WHERE stripe_session_id = ${sessionId} LIMIT 1`) as Row[];
  const r = rows[0];
  if (!r) return { order: null, transitioned: false };
  const id = Number(r.id);

  if (r.status !== "pending") {
    return { order: await getOrderById(id), transitioned: false };
  }

  await sql`
    UPDATE orders SET status = 'confirmed', stripe_payment_id = ${paymentId}, updated_at = now()
    WHERE id = ${id}
  `;
  await decrementStockForOrder(id);
  return { order: await getOrderById(id), transitioned: true };
}

/** Increment product_availability.stock_sold for each item on the fulfilment date. */
export async function decrementStockForOrder(orderId: number) {
  await sql`
    INSERT INTO product_availability (product_id, day, available, stock_sold)
    SELECT oi.product_id, COALESCE(o.fulfilment_date, CURRENT_DATE), TRUE, SUM(oi.quantity)
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.order_id = ${orderId} AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id, COALESCE(o.fulfilment_date, CURRENT_DATE)
    ON CONFLICT (product_id, day)
    DO UPDATE SET stock_sold = product_availability.stock_sold + EXCLUDED.stock_sold
  `;
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  await sql`UPDATE orders SET status = ${status}, updated_at = now() WHERE id = ${id}`;
  return getOrderById(id);
}

export async function markCancelled(id: number, refunded: boolean) {
  if (refunded) {
    await sql`
      UPDATE orders
      SET status = 'refunded', cancelled_at = now(), refunded_at = now(), updated_at = now()
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE orders
      SET status = 'cancelled', cancelled_at = now(), updated_at = now()
      WHERE id = ${id}
    `;
  }
  return getOrderById(id);
}

export async function getOrderById(id: number): Promise<Order | null> {
  const rows = (await sql`SELECT * FROM orders WHERE id = ${id} LIMIT 1`) as Row[];
  if (!rows[0]) return null;
  return hydrate(rows[0]);
}

export async function getOrderByNumberAndEmail(orderNumber: string, email: string): Promise<Order | null> {
  const rows = (await sql`
    SELECT * FROM orders
    WHERE order_number = ${orderNumber.trim().toUpperCase()}
      AND lower(customer_email) = ${email.trim().toLowerCase()}
    LIMIT 1
  `) as Row[];
  if (!rows[0]) return null;
  return hydrate(rows[0]);
}

async function hydrate(o: Row): Promise<Order> {
  const id = Number(o.id);
  const itemRows = (await sql`SELECT * FROM order_items WHERE order_id = ${id} ORDER BY id`) as Row[];
  const prefRows = (await sql`SELECT * FROM notification_prefs WHERE order_id = ${id}`) as Row[];
  const items: OrderItem[] = itemRows.map((r) => ({
    id: Number(r.id),
    orderId: id,
    productId: r.product_id === null ? null : Number(r.product_id),
    variantId: r.variant_id === null ? null : Number(r.variant_id),
    nameSnapshot: String(r.name_snapshot),
    quantity: Number(r.quantity),
    unitPrice: num(r.unit_price),
    notes: (r.notes as string) ?? null,
  }));
  const p = prefRows[0];
  return {
    id,
    orderNumber: String(o.order_number),
    type: o.type as Order["type"],
    status: o.status as OrderStatus,
    customerId: o.customer_id === null ? null : Number(o.customer_id),
    customerName: String(o.customer_name),
    customerEmail: String(o.customer_email),
    customerPhone: (o.customer_phone as string) ?? null,
    deliveryAddress: (o.delivery_address as string) ?? null,
    deliveryPostcode: (o.delivery_postcode as string) ?? null,
    collectionSlotId: o.collection_slot_id === null ? null : Number(o.collection_slot_id),
    fulfilmentDate: o.fulfilment_date ? String(o.fulfilment_date).slice(0, 10) : null,
    notes: (o.notes as string) ?? null,
    subtotal: num(o.subtotal),
    deliveryFee: num(o.delivery_fee),
    total: num(o.total),
    stripeSessionId: (o.stripe_session_id as string) ?? null,
    stripePaymentId: (o.stripe_payment_id as string) ?? null,
    createdAt: String(o.created_at),
    updatedAt: String(o.updated_at),
    cancelledAt: o.cancelled_at ? String(o.cancelled_at) : null,
    refundedAt: o.refunded_at ? String(o.refunded_at) : null,
    items,
    prefs: p ? { emailOptIn: Boolean(p.email_opt_in), smsOptIn: Boolean(p.sms_opt_in) } : undefined,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
