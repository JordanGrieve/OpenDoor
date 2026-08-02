// ─────────────────────────────────────────────────────────────
// Cost + margin maths, kept pure so it can be unit tested.
//
// Design rule: if ANY ingredient in a recipe has no cost entered, the
// variant's cost is reported as INCOMPLETE rather than as the partial
// sum. Understating cost would make margin look healthier than it is,
// which is precisely the mistake that quietly loses money on every
// order. Better to show "add costs" than a comfortable lie.
// ─────────────────────────────────────────────────────────────

export interface RecipeLine {
  /** How much of the ingredient this variant uses. */
  amount: number;
  /** Cost per unit of that ingredient, or null when not yet entered. */
  costPerUnit: number | null;
}

export interface CostResult {
  /** Total ingredient cost, or null when any line is missing a cost. */
  cost: number | null;
  /** True when every line had a cost. */
  complete: boolean;
  /** How many lines are still missing a cost. */
  missing: number;
  /** Cost of the lines we do know — for context only, never shown as "the" cost. */
  partial: number;
}

/** Sum a recipe's ingredient costs. */
export function variantCost(lines: RecipeLine[]): CostResult {
  if (lines.length === 0) {
    return { cost: null, complete: false, missing: 0, partial: 0 };
  }
  let partial = 0;
  let missing = 0;
  for (const l of lines) {
    if (l.costPerUnit === null || l.costPerUnit === undefined) {
      missing += 1;
      continue;
    }
    partial += Number(l.amount) * Number(l.costPerUnit);
  }
  const complete = missing === 0;
  return {
    cost: complete ? round2(partial) : null,
    complete,
    missing,
    partial: round2(partial),
  };
}

/** Gross margin as a percentage of price. Null when cost is unknown. */
export function grossMarginPct(price: number, cost: number | null): number | null {
  if (cost === null || cost === undefined) return null;
  if (!Number.isFinite(price) || price <= 0) return null;
  return round1(((price - cost) / price) * 100);
}

/** Profit per unit. Null when cost is unknown. */
export function grossProfit(price: number, cost: number | null): number | null {
  if (cost === null || cost === undefined) return null;
  return round2(price - cost);
}

export type MarginHealth = "unknown" | "loss" | "thin" | "ok" | "good";

/**
 * Rough health banding for a bakery. Food businesses generally want
 * ingredient cost well under a third of price, since labour, packaging,
 * energy and delivery all come out of what's left.
 */
export function marginHealth(pct: number | null): MarginHealth {
  if (pct === null) return "unknown";
  if (pct < 0) return "loss";
  if (pct < 50) return "thin";
  if (pct < 65) return "ok";
  return "good";
}

export function marginHealthLabel(health: MarginHealth): string {
  switch (health) {
    case "loss":
      return "Losing money";
    case "thin":
      return "Thin";
    case "ok":
      return "OK";
    case "good":
      return "Healthy";
    default:
      return "Add ingredient costs";
  }
}

/** Parse a cost typed into the dashboard. Blank = not entered (null). */
export function parseCost(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10000) / 10000;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
