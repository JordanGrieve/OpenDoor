import { describe, it, expect } from "vitest";
import {
  variantCost,
  grossMarginPct,
  grossProfit,
  marginHealth,
  marginHealthLabel,
  parseCost,
} from "@/lib/margin";

describe("variantCost", () => {
  it("sums amount x cost across the recipe", () => {
    const r = variantCost([
      { amount: 100, costPerUnit: 0.002 }, // 0.20
      { amount: 50, costPerUnit: 0.01 }, //  0.50
    ]);
    expect(r.cost).toBe(0.7);
    expect(r.complete).toBe(true);
    expect(r.missing).toBe(0);
  });

  // The rule that matters: a partial sum must never masquerade as the cost,
  // because an understated cost makes margin look healthier than it is.
  it("reports cost as null when ANY ingredient has no cost", () => {
    const r = variantCost([
      { amount: 100, costPerUnit: 0.002 },
      { amount: 50, costPerUnit: null },
    ]);
    expect(r.cost).toBeNull();
    expect(r.complete).toBe(false);
    expect(r.missing).toBe(1);
  });

  it("still exposes the known partial for context", () => {
    const r = variantCost([
      { amount: 100, costPerUnit: 0.002 },
      { amount: 50, costPerUnit: null },
    ]);
    expect(r.partial).toBe(0.2);
  });

  it("counts every missing ingredient", () => {
    const r = variantCost([
      { amount: 1, costPerUnit: null },
      { amount: 2, costPerUnit: null },
      { amount: 3, costPerUnit: 1 },
    ]);
    expect(r.missing).toBe(2);
    expect(r.cost).toBeNull();
  });

  it("treats an empty recipe as unknown, not free", () => {
    const r = variantCost([]);
    expect(r.cost).toBeNull();
    expect(r.complete).toBe(false);
  });

  it("handles a zero-cost ingredient as a real value, not missing", () => {
    const r = variantCost([{ amount: 10, costPerUnit: 0 }]);
    expect(r.cost).toBe(0);
    expect(r.complete).toBe(true);
    expect(r.missing).toBe(0);
  });

  it("rounds to the nearest penny", () => {
    const r = variantCost([{ amount: 3, costPerUnit: 0.3333 }]);
    expect(r.cost).toBe(1);
  });
});

describe("grossMarginPct", () => {
  it("computes margin as a percentage of price", () => {
    expect(grossMarginPct(10, 4)).toBe(60);
    expect(grossMarginPct(2.5, 1.25)).toBe(50);
  });

  it("is null when cost is unknown", () => {
    expect(grossMarginPct(10, null)).toBeNull();
  });

  it("goes negative when cost exceeds price", () => {
    expect(grossMarginPct(2, 3)).toBe(-50);
  });

  it("is null for a zero or invalid price rather than dividing by zero", () => {
    expect(grossMarginPct(0, 1)).toBeNull();
    expect(grossMarginPct(-5, 1)).toBeNull();
  });

  it("rounds to one decimal place", () => {
    expect(grossMarginPct(3, 1)).toBe(66.7);
  });
});

describe("grossProfit", () => {
  it("is price minus cost", () => {
    expect(grossProfit(4, 1.5)).toBe(2.5);
  });

  it("is null when cost is unknown", () => {
    expect(grossProfit(4, null)).toBeNull();
  });

  it("goes negative on a loss-making product", () => {
    expect(grossProfit(2, 3)).toBe(-1);
  });
});

describe("marginHealth", () => {
  it("flags unknown when there is no margin", () => {
    expect(marginHealth(null)).toBe("unknown");
    expect(marginHealthLabel(marginHealth(null))).toBe("Add ingredient costs");
  });

  it("flags a loss", () => {
    expect(marginHealth(-10)).toBe("loss");
    expect(marginHealthLabel("loss")).toBe("Losing money");
  });

  it("flags thin margins below 50%", () => {
    expect(marginHealth(0)).toBe("thin");
    expect(marginHealth(49.9)).toBe("thin");
  });

  it("bands ok and good", () => {
    expect(marginHealth(50)).toBe("ok");
    expect(marginHealth(64.9)).toBe("ok");
    expect(marginHealth(65)).toBe("good");
    expect(marginHealth(80)).toBe("good");
  });
});

describe("parseCost", () => {
  it("treats blank as not entered", () => {
    expect(parseCost("")).toBeNull();
    expect(parseCost(null)).toBeNull();
    expect(parseCost(undefined)).toBeNull();
  });

  it("parses decimal costs to 4dp for cheap-per-gram ingredients", () => {
    expect(parseCost("0.0025")).toBe(0.0025);
    expect(parseCost(1.5)).toBe(1.5);
  });

  it("keeps a genuine zero", () => {
    expect(parseCost(0)).toBe(0);
  });

  it("rejects negatives and nonsense as not-entered rather than throwing", () => {
    expect(parseCost(-1)).toBeNull();
    expect(parseCost("abc")).toBeNull();
  });
});
