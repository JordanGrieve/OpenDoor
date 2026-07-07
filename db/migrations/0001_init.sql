-- ═══════════════════════════════════════════════════════════════
-- Open Door Bakery — initial schema (17 tables)
-- Neon Postgres. Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- ── Products ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                SERIAL PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL DEFAULT 'Other',
  price             NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  lead_time_days    INTEGER NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0),
  celebration       BOOLEAN NOT NULL DEFAULT FALSE,   -- personalisable, confirm before payment
  meta_title        TEXT,
  meta_description  TEXT,
  archived          BOOLEAN NOT NULL DEFAULT FALSE,   -- soft delete
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_archived ON products (archived);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- ── Product variants ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id           SERIAL PRIMARY KEY,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  price        NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock_limit  INTEGER,                                -- NULL = unlimited
  sort_order   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants (product_id);

-- ── Product images (Cloudflare Images) ─────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id             SERIAL PRIMARY KEY,
  product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cloudflare_id  TEXT,                                 -- Cloudflare Images image id
  url            TEXT NOT NULL,                        -- delivery URL
  alt            TEXT NOT NULL DEFAULT '',
  position       INTEGER NOT NULL DEFAULT 0            -- ordered gallery
);
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images (product_id, position);

-- ── Allergens ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS allergens (
  id    SERIAL PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

-- ── Product ⇄ Allergen (junction) ──────────────────────────────
CREATE TABLE IF NOT EXISTS product_allergens (
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allergen_id  INTEGER NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, allergen_id)
);

-- ── Daily availability + stock sold ────────────────────────────
CREATE TABLE IF NOT EXISTS product_availability (
  id           SERIAL PRIMARY KEY,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  day          DATE NOT NULL,
  available    BOOLEAN NOT NULL DEFAULT TRUE,
  stock_sold   INTEGER NOT NULL DEFAULT 0 CHECK (stock_sold >= 0),
  UNIQUE (product_id, day)
);

-- ── Ingredients ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredients (
  id        SERIAL PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  unit      TEXT NOT NULL DEFAULT 'g',                 -- g, ml, unit, ...
  category  TEXT NOT NULL DEFAULT 'Other',             -- for shopping-list grouping
  stock     NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- ── Recipe items (ingredient amounts per variant) ──────────────
CREATE TABLE IF NOT EXISTS recipe_items (
  id             SERIAL PRIMARY KEY,
  variant_id     INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  ingredient_id  INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  amount         NUMERIC(12,3) NOT NULL CHECK (amount >= 0),
  UNIQUE (variant_id, ingredient_id)
);

-- ── Customers (optional Clerk-backed accounts) ─────────────────
CREATE TABLE IF NOT EXISTS customers (
  id             SERIAL PRIMARY KEY,
  clerk_user_id  TEXT UNIQUE,
  email          TEXT NOT NULL,
  name           TEXT,
  phone          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (lower(email));

-- ── Collection slots (referenced by orders) ────────────────────
CREATE TABLE IF NOT EXISTS collection_slots (
  id          SERIAL PRIMARY KEY,
  slot_time   TEXT NOT NULL,                           -- '09:00'
  label       TEXT NOT NULL,                           -- '9:00 – 9:30am'
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ── Order number sequence ──────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 84;   -- design shows ORD-0084

-- ── Orders ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  order_number       TEXT NOT NULL UNIQUE
                       DEFAULT ('ORD-' || lpad(nextval('order_number_seq')::text, 4, '0')),
  type               TEXT NOT NULL DEFAULT 'collection'
                       CHECK (type IN ('collection','delivery','contract')),
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','confirmed','ready','collected','dispatched','cancelled','refunded')),
  customer_id        INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name      TEXT NOT NULL,
  customer_email     TEXT NOT NULL,
  customer_phone     TEXT,
  delivery_address   TEXT,
  delivery_postcode  TEXT,
  collection_slot_id INTEGER REFERENCES collection_slots(id) ON DELETE SET NULL,
  fulfilment_date    DATE,
  notes              TEXT,
  subtotal           NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total              NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_session_id  TEXT,
  stripe_payment_id  TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at       TIMESTAMPTZ,
  refunded_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (fulfilment_date);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_orders_slot ON orders (collection_slot_id);

-- ── Order items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INTEGER REFERENCES products(id) ON DELETE SET NULL,
  variant_id    INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,                         -- name at time of order
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  notes         TEXT
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);

-- ── Notification preferences (per order) ───────────────────────
CREATE TABLE IF NOT EXISTS notification_prefs (
  order_id     INTEGER PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  email_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
  sms_opt_in   BOOLEAN NOT NULL DEFAULT FALSE
);

-- ── Notification log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_notifications (
  id           SERIAL PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('email','sms')),
  event        TEXT NOT NULL,                          -- confirmed | ready | dispatched | cancelled | owner_alert
  recipient    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','skipped')),
  provider_id  TEXT,
  detail       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON order_notifications (order_id);

-- ── Contacts (B2B accounts) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id            SERIAL PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name  TEXT,
  email         TEXT,
  phone         TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Settings (single row) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id                SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  delivery_fee      NUMERIC(10,2) NOT NULL DEFAULT 4.50,
  free_delivery_min NUMERIC(10,2) NOT NULL DEFAULT 40.00,
  origin_postcode   TEXT NOT NULL DEFAULT 'HG1',
  radius_miles      NUMERIC(5,1) NOT NULL DEFAULT 8.0
);

-- ── Delivery postcode prefixes ─────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_postcodes (
  id      SERIAL PRIMARY KEY,
  prefix  TEXT NOT NULL UNIQUE,                        -- 'HG1', 'HG2', 'LS21'
  active  BOOLEAN NOT NULL DEFAULT TRUE
);
