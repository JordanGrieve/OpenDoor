// Pure collection-slot capacity rules, kept free of database access so
// they can be unit tested and reused by both the storefront and checkout.

/** Statuses that no longer occupy a place in a slot. */
export const RELEASING_STATUSES = ["cancelled", "refunded"] as const;

export interface SlotCapacityInput {
  /** Places available. null/undefined = unlimited. */
  capacity: number | null;
  /** Places already taken by live orders on that date. */
  booked: number;
}

/** Places left, or null when the slot is unlimited. */
export function placesRemaining({ capacity, booked }: SlotCapacityInput): number | null {
  if (capacity === null || capacity === undefined) return null;
  return Math.max(0, capacity - Math.max(0, booked));
}

/** Is the slot full? Unlimited slots are never full. */
export function isSlotFull(input: SlotCapacityInput): boolean {
  const remaining = placesRemaining(input);
  return remaining !== null && remaining <= 0;
}

/**
 * Short human label for the storefront, or null when there's nothing
 * worth saying (unlimited, or plenty left).
 */
export function capacityLabel(input: SlotCapacityInput, lowThreshold = 3): string | null {
  const remaining = placesRemaining(input);
  if (remaining === null) return null;
  if (remaining <= 0) return "Fully booked";
  if (remaining <= lowThreshold) return remaining === 1 ? "1 place left" : `${remaining} places left`;
  return null;
}

/** Normalise a capacity value coming from a form or API payload. */
export function parseCapacity(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}
