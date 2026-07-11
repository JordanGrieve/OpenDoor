// ─────────────────────────────────────────────────────────────
// Order data access. Prices are ALWAYS recomputed from the DB —
// the client's cart prices are never trusted.
// ─────────────────────────────────────────────────────────────
import { sql } from "@/lib/db";
import { num } from "@/lib/money";
import { getDeliverySettings } from "@/lib/repos/store";
import type { CartItem, CheckoutRequest, Order, OrderItem, OrderStatus } from "@/lib/types";

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

/** Remove abandoned checkouts: unpaid pending orders older than N hours. */
export async function purgeStalePendingOrders(hours = 48): Promise<number> {
  const res = (await sql`
    DELETE FROM orders
    WHERE status = 'pending'
      AND stripe_payment_id IS NULL
      AND created_at < now() - make_interval(hours => ${hours})
  `) as unknown as { length?: number };
  return Array.isArray(res) ? res.length : 0;
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

// ── Admin listing / detail ─────────────────────────────────────

export interface AdminOrder extends Order {
  slotLabel: string | null;
}

function asArray(raw: unknown): Row[] {
  if (Array.isArray(raw)) return raw as Row[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function asObject(raw: unknown): Row | null {
  if (raw && typeof raw === "object") return raw as Row;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Row;
    } catch {
      return null;
    }
  }
  return null;
}

function mapItemsJson(raw: unknown, orderId: number): OrderItem[] {
  const arr = asArray(raw);
  return arr.map((r: Row) => ({
    id: Number(r.id),
    orderId,
    productId: r.product_id === null ? null : Number(r.product_id),
    variantId: r.variant_id === null ? null : Number(r.variant_id),
    nameSnapshot: String(r.name_snapshot),
    quantity: Number(r.quantity),
    unitPrice: num(r.unit_price),
    notes: (r.notes as string) ?? null,
  }));
}

export async function listOrders(
  opts: { status?: string | null; type?: string | null; from?: string | null; to?: string | null } = {}
): Promise<AdminOrder[]> {
  const status = opts.status ?? null;
  const type = opts.type ?? null;
  const from = opts.from ?? null;
  const to = opts.to ?? null;

  const rows = (await sql`
    SELECT o.*, cs.label AS slot_label,
      COALESCE((SELECT json_agg(oi ORDER BY oi.id) FROM order_items oi WHERE oi.order_id = o.id), '[]') AS items_json,
      (SELECT json_build_object('email_opt_in', np.email_opt_in, 'sms_opt_in', np.sms_opt_in)
       FROM notification_prefs np WHERE np.order_id = o.id) AS prefs_json
    FROM orders o
    LEFT JOIN collection_slots cs ON cs.id = o.collection_slot_id
    WHERE (${status}::text IS NULL OR o.status = ${status})
      AND (${type}::text IS NULL OR o.type = ${type})
      AND (${from}::date IS NULL OR o.fulfilment_date >= ${from})
      AND (${to}::date IS NULL OR o.fulfilment_date <= ${to})
    ORDER BY o.fulfilment_date NULLS LAST, cs.sort_order NULLS LAST, o.created_at
  `) as Row[];

  return rows.map((o) => {
    const id = Number(o.id);
    const p = asObject(o.prefs_json);
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
      items: mapItemsJson(o.items_json, id),
      prefs: p ? { emailOptIn: Boolean(p.email_opt_in), smsOptIn: Boolean(p.sms_opt_in) } : undefined,
      slotLabel: (o.slot_label as string) ?? null,
    };
  });
}

export interface OrderNotificationLog {
  id: number;
  channel: string;
  event: string;
  recipient: string;
  status: string;
  detail: string | null;
  createdAt: string;
}

export async function getOrderNotifications(orderId: number): Promise<OrderNotificationLog[]> {
  const rows = (await sql`
    SELECT id, channel, event, recipient, status, detail, created_at
    FROM order_notifications WHERE order_id = ${orderId} ORDER BY created_at
  `) as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    channel: String(r.channel),
    event: String(r.event),
    recipient: String(r.recipient),
    status: String(r.status),
    detail: (r.detail as string) ?? null,
    createdAt: String(r.created_at),
  }));
}

// ── Customer account: order history + one-tap reorder ──────────

export interface AccountOrder {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  type: Order["type"];
  fulfilmentDate: string | null;
  total: number;
  createdAt: string;
  lines: { name: string; quantity: number; unitPrice: number }[];
  reorderItems: CartItem[]; // only currently-available lines
}

export async function getAccountOrders(email: string): Promise<AccountOrder[]> {
  const rows = (await sql`
    SELECT o.id, o.order_number, o.status, o.type, o.fulfilment_date, o.total, o.created_at,
           oi.product_id, oi.variant_id, oi.name_snapshot, oi.quantity, oi.unit_price, oi.notes,
           p.slug, p.name AS product_name, p.lead_time_days, p.celebration, p.archived,
           (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY position LIMIT 1) AS image_url,
           COALESCE(v.price, p.price) AS current_price, v.label AS variant_label
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN product_variants v ON v.id = oi.variant_id
    WHERE lower(o.customer_email) = ${email.toLowerCase()}
    ORDER BY o.created_at DESC, oi.id
  `) as Row[];

  const byOrder = new Map<number, AccountOrder>();
  for (const r of rows) {
    const oid = Number(r.id);
    if (!byOrder.has(oid)) {
      byOrder.set(oid, {
        id: oid,
        orderNumber: String(r.order_number),
        status: r.status as OrderStatus,
        type: r.type as Order["type"],
        fulfilmentDate: r.fulfilment_date ? String(r.fulfilment_date).slice(0, 10) : null,
        total: num(r.total),
        createdAt: String(r.created_at),
        lines: [],
        reorderItems: [],
      });
    }
    const o = byOrder.get(oid)!;
    o.lines.push({ name: String(r.name_snapshot), quantity: Number(r.quantity), unitPrice: num(r.unit_price) });

    // reorderable only if the product still exists and isn't archived
    if (r.product_id && r.slug && !r.archived) {
      o.reorderItems.push({
        productId: Number(r.product_id),
        slug: String(r.slug),
        variantId: r.variant_id === null ? null : Number(r.variant_id),
        name: String(r.product_name ?? r.name_snapshot),
        variantLabel: (r.variant_label as string) ?? null,
        price: num(r.current_price),
        quantity: Number(r.quantity),
        leadTimeDays: Number(r.lead_time_days ?? 0),
        imageUrl: (r.image_url as string) ?? null,
        celebration: Boolean(r.celebration),
      });
    }
  }
  return [...byOrder.values()];
}

// ── Manual B2B / contract order (no Stripe) ────────────────────

export interface ManualOrderInput {
  customer: { name: string; email: string; phone?: string | null };
  items: { name: string; quantity: number; unitPrice: number; productId?: number | null; notes?: string | null }[];
  fulfilmentDate?: string | null;
  notes?: string | null;
}

export async function createManualOrder(input: ManualOrderInput): Promise<{ id: number; orderNumber: string; total: number }> {
  if (!input.items.length) throw new Error("Add at least one line item.");
  const subtotal = round2(input.items.reduce((t, i) => t + i.unitPrice * i.quantity, 0));

  const orderRows = (await sql`
    INSERT INTO orders (type, status, customer_name, customer_email, customer_phone, fulfilment_date, notes, subtotal, delivery_fee, total)
    VALUES ('contract', 'confirmed', ${input.customer.name}, ${input.customer.email}, ${input.customer.phone ?? null},
            ${input.fulfilmentDate ?? null}, ${input.notes ?? null}, ${subtotal}, 0, ${subtotal})
    RETURNING id, order_number
  `) as Row[];
  const id = Number(orderRows[0].id);
  const orderNumber = String(orderRows[0].order_number);

  for (const it of input.items) {
    await sql`
      INSERT INTO order_items (order_id, product_id, variant_id, name_snapshot, quantity, unit_price, notes)
      VALUES (${id}, ${it.productId ?? null}, ${null}, ${it.name}, ${it.quantity}, ${it.unitPrice}, ${it.notes ?? null})
    `;
  }
  await sql`INSERT INTO notification_prefs (order_id, email_opt_in, sms_opt_in) VALUES (${id}, FALSE, FALSE) ON CONFLICT DO NOTHING`;
  return { id, orderNumber, total: subtotal };
}
