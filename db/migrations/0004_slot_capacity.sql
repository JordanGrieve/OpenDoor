-- Per-slot collection capacity.
-- NULL = unlimited, so existing slots keep their current behaviour until
-- the baker sets a number in the dashboard.
ALTER TABLE collection_slots ADD COLUMN IF NOT EXISTS capacity INTEGER;

-- Guard against a nonsensical negative capacity.
ALTER TABLE collection_slots DROP CONSTRAINT IF EXISTS collection_slots_capacity_positive;
ALTER TABLE collection_slots
  ADD CONSTRAINT collection_slots_capacity_positive CHECK (capacity IS NULL OR capacity >= 0);

-- Counting booked places filters by slot + date and ignores cancelled orders.
CREATE INDEX IF NOT EXISTS idx_orders_slot_date
  ON orders (collection_slot_id, fulfilment_date);
