// ─────────────────────────────────────────────────────────────
// Minimal fixed-window rate limiter for the public API routes.
//
// Scope/limitation: counters live in this process's memory. On Vercel
// each serverless instance keeps its own, so under scale-out the real
// limit is per-instance rather than global. It reliably blunts naive
// floods from a single IP (spam, cost abuse, order-number guessing) but
// is not a hard guarantee — a shared store (Vercel KV / Upstash) would
// be needed for that. Turnstile covers human verification separately;
// this is defence in depth.
// ─────────────────────────────────────────────────────────────

export interface RateLimitRule {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Seconds until the window resets (>= 1 when limited). */
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Stop the map growing without bound on a long-lived instance.
const MAX_BUCKETS = 10_000;

function sweep(now: number) {
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Consume one unit against `key`. Pure enough to test: pass `now` to
 * control the clock.
 */
export function rateLimit(key: string, rule: RateLimitRule, now: number = Date.now()): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) sweep(now);
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, remaining: Math.max(0, rule.limit - 1), retryAfterSeconds: 0 };
  }

  if (existing.count >= rule.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true, remaining: Math.max(0, rule.limit - existing.count), retryAfterSeconds: 0 };
}

/** Test seam — clears all counters. */
export function resetRateLimits() {
  buckets.clear();
}

/**
 * Best-effort client IP. Vercel sets x-forwarded-for; the first entry is
 * the original client. Falls back to a shared bucket so a missing header
 * still gets *some* limiting rather than none.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Per-endpoint budgets. Deliberately generous for humans, tight for scripts. */
export const LIMITS = {
  /** Emails + Postbox tickets — real money and a real inbox. */
  contact: { limit: 5, windowMs: 10 * 60_000 },
  /** Review submissions awaiting moderation. */
  reviews: { limit: 5, windowMs: 60 * 60_000 },
  /** Stripe session creation. */
  checkout: { limit: 10, windowMs: 10 * 60_000 },
  /** Order lookup is an enumeration surface, so keep it tighter. */
  orderLookup: { limit: 10, windowMs: 5 * 60_000 },
} as const satisfies Record<string, RateLimitRule>;

/**
 * Guard a route. Returns a 429 Response when limited, or null to proceed.
 */
export function rateLimitGuard(req: Request, name: keyof typeof LIMITS, message?: string): Response | null {
  const result = rateLimit(`${name}:${clientIp(req)}`, LIMITS[name]);
  if (result.ok) return null;

  return new Response(
    JSON.stringify({
      error: message || "Too many requests — please wait a moment and try again.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}
