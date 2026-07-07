// Admin writes for settings, collection slots and delivery postcodes.
import { sql } from "@/lib/db";
import type { DeliverySettings } from "@/lib/types";

type Row = Record<string, unknown>;

export async function updateSettings(s: DeliverySettings) {
  await sql`
    INSERT INTO settings (id, delivery_fee, free_delivery_min, origin_postcode, radius_miles)
    VALUES (1, ${s.deliveryFee}, ${s.freeDeliveryMin}, ${s.originPostcode}, ${s.radiusMiles})
    ON CONFLICT (id) DO UPDATE SET
      delivery_fee = ${s.deliveryFee}, free_delivery_min = ${s.freeDeliveryMin},
      origin_postcode = ${s.originPostcode}, radius_miles = ${s.radiusMiles}
  `;
}

// ── Collection slots ───────────────────────────────────────────
export async function addSlot(slotTime: string, label: string) {
  const posRows = (await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM collection_slots`) as Row[];
  await sql`
    INSERT INTO collection_slots (slot_time, label, active, sort_order)
    VALUES (${slotTime}, ${label}, TRUE, ${Number(posRows[0].next)})
  `;
}
export async function setSlotActive(id: number, active: boolean) {
  await sql`UPDATE collection_slots SET active = ${active} WHERE id = ${id}`;
}
export async function removeSlot(id: number) {
  await sql`DELETE FROM collection_slots WHERE id = ${id}`;
}

// ── Delivery postcodes ─────────────────────────────────────────
export interface PostcodeRow { id: number; prefix: string; active: boolean }

export async function listPostcodes(): Promise<PostcodeRow[]> {
  const rows = (await sql`SELECT id, prefix, active FROM delivery_postcodes ORDER BY prefix`) as Row[];
  return rows.map((r) => ({ id: Number(r.id), prefix: String(r.prefix), active: Boolean(r.active) }));
}
export async function addPostcode(prefix: string) {
  const clean = prefix.toUpperCase().replace(/\s+/g, "");
  await sql`INSERT INTO delivery_postcodes (prefix, active) VALUES (${clean}, TRUE) ON CONFLICT (prefix) DO UPDATE SET active = TRUE`;
}
export async function setPostcodeActive(id: number, active: boolean) {
  await sql`UPDATE delivery_postcodes SET active = ${active} WHERE id = ${id}`;
}
export async function removePostcode(id: number) {
  await sql`DELETE FROM delivery_postcodes WHERE id = ${id}`;
}
