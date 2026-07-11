-- ═══════════════════════════════════════════════════════════════
-- Open Door Bakery — seed data (idempotent, safe to re-run)
-- ═══════════════════════════════════════════════════════════════

-- ── Settings singleton ─────────────────────────────────────────
INSERT INTO settings (id, delivery_fee, free_delivery_min, origin_postcode, radius_miles)
VALUES (1, 4.50, 40.00, 'ML3 7PD', 8.0)
ON CONFLICT (id) DO NOTHING;

-- ── Allergens ──────────────────────────────────────────────────
INSERT INTO allergens (slug, name) VALUES
  ('gluten',  'Gluten'),
  ('dairy',   'Dairy'),
  ('egg',     'Egg'),
  ('nuts',    'Tree nuts'),
  ('peanuts', 'Peanuts'),
  ('soya',    'Soya'),
  ('sesame',  'Sesame')
ON CONFLICT (slug) DO NOTHING;

-- ── Collection slots ───────────────────────────────────────────
INSERT INTO collection_slots (slot_time, label, active, sort_order) VALUES
  ('09:00', '9:00 – 9:30am',   TRUE, 1),
  ('10:00', '10:00 – 10:30am', TRUE, 2),
  ('11:00', '11:00 – 11:30am', TRUE, 3),
  ('12:00', '12:00 – 12:30pm', TRUE, 4),
  ('13:00', '1:00 – 1:30pm',   TRUE, 5)
ON CONFLICT DO NOTHING;

-- ── Delivery postcodes ─────────────────────────────────────────
-- ~8-mile delivery area around Hamilton (ML3) — outward-code districts.
INSERT INTO delivery_postcodes (prefix, active) VALUES
  ('ML1', TRUE), ('ML2', TRUE), ('ML3', TRUE), ('ML4', TRUE), ('ML5', TRUE),
  ('ML6', TRUE), ('ML9', TRUE), ('ML10', TRUE),
  ('G71', TRUE), ('G72', TRUE), ('G73', TRUE), ('G74', TRUE), ('G75', TRUE)
ON CONFLICT (prefix) DO NOTHING;

-- ── Ingredients (with shopping-list category) ──────────────────
INSERT INTO ingredients (name, unit, category, stock) VALUES
  ('Plain flour',       'g',    'Dry goods',   12000),
  ('Strong flour',      'g',    'Dry goods',   8000),
  ('Caster sugar',      'g',    'Dry goods',   9000),
  ('Butter',            'g',    'Dairy',       6000),
  ('Eggs',              'unit', 'Fresh',       120),
  ('Whole milk',        'ml',   'Dairy',       5000),
  ('Dark chocolate',    'g',    'Chocolate',   4000),
  ('Ground almonds',    'g',    'Nuts',        2000),
  ('Lemons',            'unit', 'Fresh',       40),
  ('Vanilla extract',   'ml',   'Flavourings', 500),
  ('Salted caramel',    'g',    'Flavourings', 1500),
  ('Seasonal fruit',    'g',    'Fresh',       3000)
ON CONFLICT (name) DO NOTHING;

-- ── Products ───────────────────────────────────────────────────
INSERT INTO products (slug, name, description, category, price, lead_time_days, celebration, meta_title, meta_description) VALUES
  ('classic-butter-croissant', 'Classic Butter Croissant',
    'All-butter dough, laminated over three days for a shatter-crisp shell and soft, honeycombed middle.',
    'Croissants', 3.20, 1, FALSE,
    'Classic Butter Croissant | Open Door Bakery',
    'Hand-laminated all-butter croissants, baked fresh in Hamilton.'),
  ('almond-croissant', 'Almond Croissant',
    'Day-old croissant reborn — soaked in syrup, filled with frangipane, dusted in icing sugar.',
    'Croissants', 3.80, 1, FALSE,
    'Almond Croissant | Open Door Bakery',
    'Frangipane-filled almond croissants, freshly baked.'),
  ('pain-au-chocolat', 'Pain au Chocolat',
    'Two batons of dark Valrhona chocolate folded into buttery, flaky layers.',
    'Croissants', 3.50, 1, FALSE,
    'Pain au Chocolat | Open Door Bakery',
    'Buttery pain au chocolat with dark Valrhona chocolate.'),
  ('salted-caramel-brownie', 'Salted Caramel Brownie',
    'Fudgy to the centre with ribbons of salted caramel and a flicker of sea salt.',
    'Brownies', 3.00, 2, FALSE,
    'Salted Caramel Brownie | Open Door Bakery',
    'Fudgy salted caramel brownies, baked to order.'),
  ('triple-chocolate-brownie', 'Triple Chocolate Brownie',
    'Dark, milk and white chocolate folded through a deeply gooey crumb.',
    'Brownies', 2.80, 2, FALSE,
    'Triple Chocolate Brownie | Open Door Bakery',
    'Deeply gooey triple chocolate brownies.'),
  ('lemon-drizzle-loaf', 'Lemon Drizzle Loaf',
    'Zesty lemon sponge soaked in tangy syrup with a crunchy sugar top.',
    'Cakes', 4.00, 2, FALSE,
    'Lemon Drizzle Loaf | Open Door Bakery',
    'Zesty lemon drizzle loaf with a crunchy sugar top.'),
  ('seasonal-fruit-tart', 'Seasonal Fruit Tart',
    'Crisp sweet pastry, vanilla crème pâtissière and a glaze of whatever fruit is best that week.',
    'Tarts', 4.50, 2, FALSE,
    'Seasonal Fruit Tart | Open Door Bakery',
    'Seasonal fruit tart with vanilla crème pâtissière.'),
  ('double-choc-cookie', 'Double Choc Cookie',
    'Crisp edges, molten chocolate chunks, a chewy heart.',
    'Cookies', 2.50, 1, FALSE,
    'Double Choc Cookie | Open Door Bakery',
    'Chewy double chocolate cookies with molten chunks.'),
  ('morning-pastry-box', 'Morning Pastry Box (6)',
    'A baker''s pick of six morning pastries — croissants, pains and a daily special.',
    'Mixed Boxes', 18.00, 2, FALSE,
    'Morning Pastry Box | Open Door Bakery',
    'A box of six morning pastries, baker''s choice.'),
  ('celebration-cake-box', 'Celebration Cake Box',
    'A two-layer celebration cake with candles and card. Choose your flavour, size and message.',
    'Celebration Boxes', 45.00, 5, TRUE,
    'Celebration Cake Box | Open Door Bakery',
    'Made-to-order celebration cakes for every occasion.'),
  ('birthday-treat-box', 'Birthday Treat Box',
    'A trio of cake slices, cookies and brownies with a personalised card — birthday joy in a box.',
    'Celebration Boxes', 32.00, 3, TRUE,
    'Birthday Treat Box | Open Door Bakery',
    'A personalised birthday treat box of cakes, cookies and brownies.')
ON CONFLICT (slug) DO NOTHING;

-- ── Product → Allergen links ───────────────────────────────────
-- helper: link by slugs
INSERT INTO product_allergens (product_id, allergen_id)
SELECT p.id, a.id FROM products p CROSS JOIN allergens a
WHERE (p.slug, a.slug) IN (
  ('classic-butter-croissant','gluten'), ('classic-butter-croissant','dairy'), ('classic-butter-croissant','egg'),
  ('almond-croissant','gluten'), ('almond-croissant','dairy'), ('almond-croissant','egg'), ('almond-croissant','nuts'),
  ('pain-au-chocolat','gluten'), ('pain-au-chocolat','dairy'), ('pain-au-chocolat','egg'), ('pain-au-chocolat','soya'),
  ('salted-caramel-brownie','gluten'), ('salted-caramel-brownie','dairy'), ('salted-caramel-brownie','egg'),
  ('triple-chocolate-brownie','gluten'), ('triple-chocolate-brownie','dairy'), ('triple-chocolate-brownie','egg'), ('triple-chocolate-brownie','soya'),
  ('lemon-drizzle-loaf','gluten'), ('lemon-drizzle-loaf','dairy'), ('lemon-drizzle-loaf','egg'),
  ('seasonal-fruit-tart','gluten'), ('seasonal-fruit-tart','dairy'), ('seasonal-fruit-tart','egg'),
  ('double-choc-cookie','gluten'), ('double-choc-cookie','dairy'), ('double-choc-cookie','egg'), ('double-choc-cookie','soya'),
  ('morning-pastry-box','gluten'), ('morning-pastry-box','dairy'), ('morning-pastry-box','egg'), ('morning-pastry-box','nuts'),
  ('celebration-cake-box','gluten'), ('celebration-cake-box','dairy'), ('celebration-cake-box','egg'), ('celebration-cake-box','nuts'),
  ('birthday-treat-box','gluten'), ('birthday-treat-box','dairy'), ('birthday-treat-box','egg'), ('birthday-treat-box','nuts')
)
ON CONFLICT DO NOTHING;

-- ── Variants ───────────────────────────────────────────────────
-- Every product gets a 'Standard' variant; boxes get sizes.
INSERT INTO product_variants (product_id, label, price, stock_limit, sort_order)
SELECT p.id, 'Standard', p.price, NULL, 0
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.label = 'Standard');

INSERT INTO product_variants (product_id, label, price, stock_limit, sort_order)
SELECT p.id, v.label, v.price, v.stock_limit, v.sort_order
FROM products p
JOIN (VALUES
  ('salted-caramel-brownie', 'Box of 4', 11.00, 40, 1),
  ('triple-chocolate-brownie', 'Box of 4', 10.00, 40, 1),
  ('double-choc-cookie', 'Box of 6', 13.50, 30, 1),
  ('celebration-cake-box', 'Serves 16–20 (10")', 60.00, 6, 1),
  ('birthday-treat-box', 'Large box', 42.00, 10, 1)
) AS v(slug, label, price, stock_limit, sort_order) ON v.slug = p.slug
WHERE NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.label = v.label);

-- ── Recipe items (a few variants, enough for a shopping list) ───
INSERT INTO recipe_items (variant_id, ingredient_id, amount)
SELECT v.id, i.id, r.amount
FROM product_variants v
JOIN products p ON p.id = v.product_id
JOIN (VALUES
  ('classic-butter-croissant', 'Standard', 'Strong flour',   90.0),
  ('classic-butter-croissant', 'Standard', 'Butter',         55.0),
  ('classic-butter-croissant', 'Standard', 'Whole milk',     30.0),
  ('salted-caramel-brownie',   'Standard', 'Dark chocolate', 45.0),
  ('salted-caramel-brownie',   'Standard', 'Butter',         35.0),
  ('salted-caramel-brownie',   'Standard', 'Caster sugar',   40.0),
  ('salted-caramel-brownie',   'Standard', 'Eggs',           1.0),
  ('salted-caramel-brownie',   'Standard', 'Salted caramel', 25.0),
  ('lemon-drizzle-loaf',       'Standard', 'Plain flour',    60.0),
  ('lemon-drizzle-loaf',       'Standard', 'Caster sugar',   55.0),
  ('lemon-drizzle-loaf',       'Standard', 'Butter',         50.0),
  ('lemon-drizzle-loaf',       'Standard', 'Lemons',         1.0),
  ('lemon-drizzle-loaf',       'Standard', 'Eggs',           1.0)
) AS r(slug, vlabel, iname, amount)
  ON r.slug = p.slug AND r.vlabel = v.label
JOIN ingredients i ON i.name = r.iname
ON CONFLICT (variant_id, ingredient_id) DO NOTHING;

-- ── Availability for the next 10 days (all products on) ────────
INSERT INTO product_availability (product_id, day, available, stock_sold)
SELECT p.id, d::date, TRUE, 0
FROM products p
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', INTERVAL '1 day') AS d
ON CONFLICT (product_id, day) DO NOTHING;

-- ── A B2B contact ──────────────────────────────────────────────
INSERT INTO contacts (business_name, contact_name, email, phone, notes)
SELECT 'Bettys Tea Room', 'Facilities Manager', 'orders@example-cafe.co.uk', '01423 000111', 'Weekly wholesale croissant order'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE business_name = 'Bettys Tea Room');
