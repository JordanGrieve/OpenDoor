// Money helpers. Store/compute in pounds (number, 2dp); Stripe wants pence.

export function formatGBP(amount: number): string {
  return "£" + Number(amount).toFixed(2);
}

export function toPence(pounds: number): number {
  return Math.round(Number(pounds) * 100);
}

export function fromPence(pence: number): number {
  return Math.round(pence) / 100;
}

/** Coerce a Postgres NUMERIC (returned as string by the driver) to a number. */
export function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}
