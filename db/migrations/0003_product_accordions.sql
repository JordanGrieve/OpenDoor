-- Per-product editable copy for the PDP accordions.
-- When NULL/empty the storefront falls back to the default site-wide text.
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_info TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_info  TEXT;
