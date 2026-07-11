-- ═══════════════════════════════════════════════════════════════
-- Customer reviews — submitted from the storefront, moderated in the
-- dashboard, approved ones shown on the site (with AggregateRating).
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS reviews (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status, published_at DESC);
