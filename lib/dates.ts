// Date helpers for fulfilment scheduling.

/** YYYY-MM-DD in local terms (no timezone drift for date-only values). */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Earliest fulfilment date = today + the longest lead time in the cart. */
export function earliestFulfilmentDate(longestLeadDays: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + Math.max(0, longestLeadDays));
  return isoDate(d);
}

/** A short list of selectable dates from the earliest, `count` days forward. */
export function fulfilmentDateOptions(longestLeadDays: number, count = 14, from = new Date()): string[] {
  const start = new Date(from);
  start.setDate(start.getDate() + Math.max(0, longestLeadDays));
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    // Kitchen is closed Mondays (baking & prep) — skip them.
    if (d.getDay() === 1) continue;
    out.push(isoDate(d));
  }
  return out;
}

/** Human label e.g. "Sat 12 Jul". */
export function prettyDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
