import { describe, it, expect } from "vitest";
import { formatGBP, toPence, fromPence, num } from "@/lib/money";

describe("formatGBP", () => {
  it("always shows two decimal places", () => {
    expect(formatGBP(4)).toBe("£4.00");
    expect(formatGBP(4.5)).toBe("£4.50");
    expect(formatGBP(12.345)).toBe("£12.35");
  });

  it("handles zero", () => {
    expect(formatGBP(0)).toBe("£0.00");
  });

  it("accepts a NUMERIC string from Postgres", () => {
    expect(formatGBP("2.50" as unknown as number)).toBe("£2.50");
  });
});

describe("toPence", () => {
  it("converts pounds to integer pence", () => {
    expect(toPence(4.5)).toBe(450);
    expect(toPence(2.5)).toBe(250);
    expect(toPence(0)).toBe(0);
  });

  it("rounds rather than truncating float error", () => {
    // 19.99 * 100 is 1998.9999... in binary floating point
    expect(toPence(19.99)).toBe(1999);
    expect(toPence(0.07)).toBe(7);
  });

  it("always returns a whole number (Stripe rejects fractional pence)", () => {
    for (const p of [1.005, 33.333, 45, 13.5]) {
      expect(Number.isInteger(toPence(p))).toBe(true);
    }
  });
});

describe("fromPence", () => {
  it("round-trips with toPence", () => {
    for (const pounds of [0, 2.5, 4.5, 13.5, 19.99, 45]) {
      expect(fromPence(toPence(pounds))).toBeCloseTo(pounds, 2);
    }
  });
});

describe("num", () => {
  it("coerces Postgres NUMERIC strings", () => {
    expect(num("10.00")).toBe(10);
    expect(num("4.50")).toBe(4.5);
  });

  it("treats null/undefined as 0 so totals never become NaN", () => {
    expect(num(null)).toBe(0);
    expect(num(undefined)).toBe(0);
  });

  it("passes numbers through", () => {
    expect(num(7)).toBe(7);
  });
});
