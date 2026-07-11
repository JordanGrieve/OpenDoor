// ─────────────────────────────────────────────────────────────
// Shared domain types — used by BOTH the storefront and the
// dashboard so a Product is the same shape wherever it appears.
// Money is always handled in pounds as a number (2dp); the DB
// stores NUMERIC and the API layer coerces to number.
// ─────────────────────────────────────────────────────────────

export type OrderType = "collection" | "delivery" | "contract";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "ready"
  | "collected"
  | "dispatched"
  | "cancelled"
  | "refunded";

export type NotificationChannel = "email" | "sms";
export type NotificationEvent =
  | "confirmed"
  | "ready"
  | "dispatched"
  | "cancelled"
  | "owner_alert";
export type NotificationStatus = "sent" | "failed" | "skipped";

export interface Allergen {
  id: number;
  slug: string;
  name: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  label: string;
  price: number;
  stockLimit: number | null; // null = unlimited
  sortOrder: number;
}

export interface ProductImage {
  id: number;
  productId: number;
  cloudflareId: string | null;
  url: string;
  alt: string;
  position: number;
}

/** The canonical Product shape (storefront card, detail page, dashboard editor). */
export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number; // base price (lowest / default variant)
  leadTimeDays: number;
  celebration: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  deliveryInfo: string | null;
  storageInfo: string | null;
  archived: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  allergens: Allergen[];
  createdAt: string;
  updatedAt: string;
}

/** Trimmed shape for grid/list contexts. */
export interface ProductSummary {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  leadTimeDays: number;
  celebration: boolean;
  imageUrl: string | null;
  allergens: Allergen[];
  hasVariants: boolean;
}

export interface CollectionSlot {
  id: number;
  slotTime: string;
  label: string;
  active: boolean;
  sortOrder: number;
}

export interface DeliverySettings {
  deliveryFee: number;
  freeDeliveryMin: number;
  originPostcode: string;
  radiusMiles: number;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  category: string;
  stock: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number | null;
  variantId: number | null;
  nameSnapshot: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
}

export interface NotificationPrefs {
  emailOptIn: boolean;
  smsOptIn: boolean;
}

export interface OrderNotification {
  id: number;
  orderId: number;
  channel: NotificationChannel;
  event: string;
  recipient: string;
  status: NotificationStatus;
  providerId: string | null;
  detail: string | null;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  customerId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryAddress: string | null;
  deliveryPostcode: string | null;
  collectionSlotId: number | null;
  fulfilmentDate: string | null;
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  stripeSessionId: string | null;
  stripePaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  refundedAt: string | null;
  items: OrderItem[];
  prefs?: NotificationPrefs;
}

// ── Cart (client-side) ─────────────────────────────────────────
export interface CartItem {
  productId: number;
  slug: string;
  variantId: number | null;
  name: string;
  variantLabel: string | null;
  price: number;
  quantity: number;
  leadTimeDays: number;
  imageUrl: string | null;
  celebration: boolean;
  notes?: string;
}

// ── Checkout request payload (storefront → API) ────────────────
export interface CheckoutRequest {
  fulfilment: "collection" | "delivery";
  items: { variantId: number | null; productId: number; quantity: number; notes?: string }[];
  customer: { name: string; email: string; phone: string };
  collectionSlotId?: number | null;
  fulfilmentDate?: string | null; // ISO date
  deliveryAddress?: string | null;
  deliveryPostcode?: string | null;
  notifications: { email: boolean; sms: boolean };
  orderNotes?: string;
}
