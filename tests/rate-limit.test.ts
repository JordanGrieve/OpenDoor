import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimits, clientIp, LIMITS } from "@/lib/rate-limit";

const RULE = { limit: 3, windowMs: 60_000 };

beforeEach(() => resetRateLimits());

describe("rateLimit", () => {
  it("allows requests up to the limit", () => {
    const t = 1_000;
    expect(rateLimit("a", RULE, t).ok).toBe(true);
    expect(rateLimit("a", RULE, t).ok).toBe(true);
    expect(rateLimit("a", RULE, t).ok).toBe(true);
  });

  it("blocks the request immediately after the limit", () => {
    const t = 1_000;
    for (let i = 0; i < RULE.limit; i++) rateLimit("a", RULE, t);
    const blocked = rateLimit("a", RULE, t);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("counts down remaining accurately", () => {
    const t = 1_000;
    expect(rateLimit("a", RULE, t).remaining).toBe(2);
    expect(rateLimit("a", RULE, t).remaining).toBe(1);
    expect(rateLimit("a", RULE, t).remaining).toBe(0);
  });

  it("keeps separate counters per key, so one IP can't block another", () => {
    const t = 1_000;
    for (let i = 0; i < RULE.limit; i++) rateLimit("ip-a", RULE, t);
    expect(rateLimit("ip-a", RULE, t).ok).toBe(false);
    // A different client is unaffected.
    expect(rateLimit("ip-b", RULE, t).ok).toBe(true);
  });

  it("resets once the window has elapsed", () => {
    const t = 1_000;
    for (let i = 0; i < RULE.limit; i++) rateLimit("a", RULE, t);
    expect(rateLimit("a", RULE, t).ok).toBe(false);

    const afterWindow = t + RULE.windowMs + 1;
    const fresh = rateLimit("a", RULE, afterWindow);
    expect(fresh.ok).toBe(true);
    expect(fresh.remaining).toBe(RULE.limit - 1);
  });

  it("still blocks just before the window expires", () => {
    const t = 1_000;
    for (let i = 0; i < RULE.limit; i++) rateLimit("a", RULE, t);
    const justBefore = t + RULE.windowMs - 1;
    expect(rateLimit("a", RULE, justBefore).ok).toBe(false);
  });

  it("reports a usable Retry-After of at least one second", () => {
    const t = 1_000;
    for (let i = 0; i < RULE.limit; i++) rateLimit("a", RULE, t);

    const early = rateLimit("a", RULE, t);
    expect(early.retryAfterSeconds).toBeGreaterThan(0);
    expect(early.retryAfterSeconds).toBeLessThanOrEqual(RULE.windowMs / 1000);

    // Even a millisecond before reset it must not round down to 0.
    const late = rateLimit("a", RULE, t + RULE.windowMs - 1);
    expect(late.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});

describe("clientIp", () => {
  const make = (headers: Record<string, string>) => new Request("https://example.com", { headers });

  it("takes the first entry of x-forwarded-for (the original client)", () => {
    expect(clientIp(make({ "x-forwarded-for": "203.0.113.7, 70.41.3.18" }))).toBe("203.0.113.7");
  });

  it("trims whitespace", () => {
    expect(clientIp(make({ "x-forwarded-for": "  203.0.113.7  " }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(make({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("degrades to a shared bucket rather than no limiting at all", () => {
    expect(clientIp(make({}))).toBe("unknown");
  });
});

describe("LIMITS", () => {
  it("defines a positive budget and window for every endpoint", () => {
    for (const [name, rule] of Object.entries(LIMITS)) {
      expect(rule.limit, name).toBeGreaterThan(0);
      expect(rule.windowMs, name).toBeGreaterThan(0);
    }
  });

  it("keeps order lookup tight, since it is an enumeration surface", () => {
    // Lookup budget must not be looser per-minute than contact.
    const lookupPerMin = LIMITS.orderLookup.limit / (LIMITS.orderLookup.windowMs / 60_000);
    expect(lookupPerMin).toBeLessThanOrEqual(5);
  });
});
