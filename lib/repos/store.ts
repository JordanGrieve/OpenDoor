// Settings, collection slots and delivery postcode data access.
import { sql } from "@/lib/db";
import { num } from "@/lib/money";
import type { CollectionSlot, DeliverySettings } from "@/lib/types";

type Row = Record<string, unknown>;

export async function getDeliverySettings(): Promise<DeliverySettings> {
  const rows = (await sql`
    SELECT delivery_fee, free_delivery_min, origin_postcode, radius_miles
    FROM settings WHERE id = 1
  `) as Row[];
  const r = rows[0];
  if (!r) {
    return { deliveryFee: 4.5, freeDeliveryMin: 40, originPostcode: "ML3 7PD", radiusMiles: 8 };
  }
  return {
    deliveryFee: num(r.delivery_fee),
    freeDeliveryMin: num(r.free_delivery_min),
    originPostcode: String(r.origin_postcode),
    radiusMiles: num(r.radius_miles),
  };
}

export async function getCollectionSlots(activeOnly = true): Promise<CollectionSlot[]> {
  const rows = (activeOnly
    ? ((await sql`SELECT * FROM collection_slots WHERE active = TRUE ORDER BY sort_order, slot_time`) as Row[])
    : ((await sql`SELECT * FROM collection_slots ORDER BY sort_order, slot_time`) as Row[]));
  return rows.map((r) => ({
    id: Number(r.id),
    slotTime: String(r.slot_time),
    label: String(r.label),
    active: Boolean(r.active),
    sortOrder: Number(r.sort_order),
  }));
}

/** Returns the list of active postcode prefixes (uppercased, no spaces). */
export async function getDeliveryPrefixes(): Promise<string[]> {
  const rows = (await sql`SELECT prefix FROM delivery_postcodes WHERE active = TRUE`) as Row[];
  return rows.map((r) => String(r.prefix).toUpperCase().replace(/\s+/g, ""));
}

/**
 * Outward code (district) of a full UK postcode, or null if it isn't one.
 * The inward code is always the final 3 chars, so "ML3 7PD" → "ML3".
 * Pure + exported so it can be unit tested without a database.
 */
export function postcodeDistrict(postcode: string): string | null {
  const normalized = String(postcode ?? "").toUpperCase().replace(/\s+/g, "");
  if (normalized.length < 5) return null; // not a full postcode
  return normalized.slice(0, -3);
}

/** Pure district match — the logic behind isPostcodeDeliverable. */
export function isPostcodeInDistricts(postcode: string, districts: string[]): boolean {
  const outward = postcodeDistrict(postcode);
  if (!outward) return false;
  return districts.includes(outward);
}

/**
 * Is a full postcode within the delivery area? Matches on the outward code
 * (district) exactly, so this correctly distinguishes ML1 from ML10/ML11.
 */
export async function isPostcodeDeliverable(postcode: string): Promise<boolean> {
  const districts = await getDeliveryPrefixes();
  return isPostcodeInDistricts(postcode, districts);
}
