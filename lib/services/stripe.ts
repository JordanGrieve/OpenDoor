// ─────────────────────────────────────────────────────────────
// Stripe client (hosted Checkout + refunds).
// Card data NEVER touches our API — we only create Checkout
// Sessions and handle webhooks. Returns null when unconfigured so
// callers can degrade gracefully in local/dev without keys.
// ─────────────────────────────────────────────────────────────
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[stripe] STRIPE_SECRET_KEY not set — Stripe calls are disabled.");
    return null;
  }
  // Pin to the SDK's expected API version (cast keeps us resilient to SDK bumps).
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion });
  return _stripe;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function webhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}
