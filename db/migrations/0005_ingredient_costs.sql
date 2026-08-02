-- Ingredient unit costs, so product margins can be calculated from the
-- recipes that already exist.
-- NULL = cost not yet entered. Deliberately nullable: a missing cost must
-- make a product's cost "incomplete" rather than silently look cheaper.
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(10,4);

ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_cost_positive;
ALTER TABLE ingredients
  ADD CONSTRAINT ingredients_cost_positive CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0);
