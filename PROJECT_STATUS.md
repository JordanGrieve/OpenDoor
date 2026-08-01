# Open Door Bakery — Project Status

_Last updated: 2026-08-01_

## Overview

Open Door Bakery is an online-only artisan bakery platform for a Hamilton (Scotland) baker — a single Next.js (App Router) app containing the customer storefront, a Clerk-gated admin dashboard, and the backend API. It is built (feature-complete for an MVP), deployed live at **opendoorbakery.com** on Vercel with Neon Postgres, Stripe, Resend, Cloudinary, Clerk, Postbox and Cloudflare Turnstile all wired in. It is **not yet selling**: the site is deliberately in a "pre-launch" mode (buy buttons disabled, checkout API blocked) while pricing is finalised and a few launch-blocking setup tasks are completed. Target go-live is around **September 2026**.

## Where we are now

The product works end-to-end and is deployed. A later session on 2026-08-01 worked the engineering backlog down to zero: the project now has an **automated test suite (90 tests)**, **API rate limiting**, **collection-slot capacity limits**, no **fabricated social proof**, and an **accurate README**. Everything remaining is either an owner/ops action (Clerk production instance, Vercel env vars, Google Business Profile, Search Console) or needs a business decision from Jordan (pricing, one product photo).

Two hazards were surfaced along the way and are *not* yet fixed: local development points at the **production database**, and the app runs a **Next.js version with 8 high-severity advisories**. Both are described under Risks.

## Completed

- **Storefront** (11 pages): home, shop, product detail (PDP), custom orders, gallery, contact, cart, checkout, account, order lookup/cancel.
- **Admin dashboard** (12 pages): analytics, orders + order detail + status flow, **B2B/wholesale orders**, product CRUD (variants, recipes, allergens, availability, images), **stock**, reviews moderation, settings, login, denied.
- **API** (35 routes) across public, storefront, and `/api/admin` (middleware-gated).
- **Database**: Neon Postgres with owned migrations (`0001_init`, `0002_reviews`, `0003_product_accordions`); zero-config local dev via embedded PGlite (WASM Postgres) that auto-creates schema + seeds.
- **Payments**: Stripe hosted Checkout + webhook + confirm-on-return + automatic refunds.
- **Email**: Resend transactional email (domain verified).
- **Images**: Cloudinary (`f_auto,q_auto`); bucket reorganised today into `open-door/products/<slug>` with 60 demo/junk assets removed.
- **Auth**: dashboard gated by Clerk (email allowlist + signed-cookie fast-path) with a password-session fallback; scoped away from the storefront.
- **Enquiries/anti-spam**: contact + custom-order enquiries route to Postbox tickets; Cloudflare Turnstile on forms.
- **Reviews**: DB-backed, moderated (approve/reject in dashboard).
- **Local SEO / GEO foundation**: `LocalBusiness (Bakery)` + `Product` JSON-LD, sitemap (all pages + products), robots.txt, per-page canonicals, Hamilton relocation, outward-code delivery-postcode matching.
- **Mobile polish**: side-drawer menu, scroll-snap carousels (content-aligned), footer accordion, cart stacking + non-overflowing line items, PDP fixes, single-column contact, underlined shop category tabs.
- **Pre-launch mode**: `SELLING_ENABLED` flag disables all buy buttons and returns 503 from the checkout API.
- **SEO fixes (today)**: fixed doubled `"| Open Door Bakery"` in product titles; JSON-LD availability now `PreOrder` while pre-launch; honest hero stat (real review data, not fabricated numbers).
- **Ops**: deployed to Vercel (auto-deploy from `main`), Cloudflare DNS, domain live.

### Completed 2026-08-01 (engineering backlog)

- **Automated test suite** (`0f23a11`) — Vitest, `npm test`, 90 tests across money/pence rounding, fulfilment dates, postcode districts, product-input normalisation, SEO JSON-LD, rate limiting and slot capacity. Proven non-vacuous by a mutation check.
- **Fabricated social proof removed** (`01d56f8`) — the three invented testimonials are gone; the section shows only real approved reviews, with an honest empty state otherwise. "Bestselling boxes" (zero orders ever) became "Emma's favourites".
- **API rate limiting** (`a8d25cf`) — `lib/rate-limit.ts` guards contact, reviews, checkout and order-lookup with per-endpoint budgets and `429 + Retry-After`.
- **Collection-slot capacity** (`f24c11c`) — migration 0004 adds nullable `capacity`; availability derives from live orders (cancelled/refunded release their place); enforced **server-side** at checkout; editable per slot in the dashboard; full slots shown disabled with "Fully booked" / "N places left".
- **README rewritten** (`335f05c`) — corrected Cloudflare Images → Cloudinary, Clerk's actual role (admin gating, not customer accounts), Twilio's real state (implemented but unconfigured), and removed stale "in progress" markers.

## In progress

_Nothing actively in progress — the code queue is empty. The items below need a decision or an action from Jordan._

## Remaining work

**Needs a decision from Jordan**
- **Pricing review** — analysis done and posted to Asana. Chief suspect: **Lemon Drizzle Loaf at £4.00**, which is cheaper than a single almond croissant and far below market for a whole loaf (either the price or the name is wrong). Also: celebration box variants don't state size/servings, and bulk discounts vary 8.3–10.7%. **Blocked** on Jordan's prices.
- **Product imagery** — 11 of 12 products have a photo; **Birthday Treat Box has none**. The only unused stock image is branded "L'ARTISAN BAKERY" so it cannot be used. **Blocked** on a photo file.

**Owner/ops actions**
- **Clerk production instance** — production still runs a **development** instance (redirects to `*.accounts.dev`). Needs prod instance + DNS + `pk_live_/sk_live_` in Vercel.
- **Verify Vercel env vars** — `EMAIL_FROM`, `STRIPE_WEBHOOK_SECRET` (local is a 2-char placeholder), live `STRIPE_SECRET_KEY`, and whether `EMAIL_REPLY_DOMAIN` (`thepastrybox.co.uk`) is intentional.
- **Google Business Profile** — not created; the single biggest factor for ranking on "hamilton bakery".
- **Google Search Console** — verify domain, submit sitemap.
- **Confirm business facts** — verify the map pin (lat 55.76005 / lon -4.038857) lands on 18 Avonbank; confirm `hello@opendoorbakery.com` is monitored; add a phone number and opening hours.
- **Live Stripe test order + refund** before opening.

**Newly identified engineering work (not started)**
- **Stop local dev writing to production** — see Risks; needs a Neon dev branch or an unset `DATABASE_URL`.
- **Next.js security upgrade** — 8 high-severity advisories; needs a deliberate, tested upgrade.
- **Ingredient costs** — `ingredients` has no cost column, so margins can't be computed; this is what makes pricing guesswork.

## Blockers

- **Clerk is on a dev instance in production** — the main auth blocker for a clean launch.
- **Production env values can't be verified from the code** — needs the owner to confirm in Vercel.
- **Selling intentionally disabled** until pricing is reviewed (self-imposed, correct).
- **Pricing decisions** — can't be made without Jordan, and can't be made *well* without ingredient costs.
- **Birthday Treat Box photo** — needs a real image file.
- **Google Business Profile / Search Console are owner actions** and not started — GEO ranking can't begin without them.
- **Local dev writes to production** — structural hazard, see Risks.

## Successes

- **Zero-config local dev**: the app boots with no database and no keys thanks to an in-process PGlite fallback; every external service degrades gracefully (logs the intended action instead of failing).
- **Dashboard exceeds MVP**: analytics, B2B orders, stock, a shopping-list generator and CSV export are all built and working.
- **Robust drawer animation fix**: the preview/background browser tab pauses CSS animations *and* `requestAnimationFrame`; switching the menu mount-transition to `setTimeout` fixed a genuinely subtle bug.
- **Solid auth architecture**: Clerk + allowlist + signed-cookie fast-path, with a password fallback — well factored.
- **Clean data + green types**: no orphaned rows, TypeScript passes throughout, and every change this session was verified live in a real browser rather than assumed.
- **The engineering backlog is now empty** (2026-08-01): tests, rate limiting, slot capacity, the testimonials fix and the README all landed in one pass, each verified against a running server or the real schema rather than accepted on a green typecheck.
- **Capacity enforcement is honest**: booked counts derive from live orders instead of a counter column, so they cannot drift; and the rule is re-checked server-side at checkout rather than trusting the UI.

## Failures & lessons learned

- **Cloudflare Images → Cloudinary**: the original image plan (Cloudflare Images, still named in the README) was dropped for Cloudinary. README is now stale.
- **Twilio SMS abandoned (for now)**: Twilio is still a dependency and in the README, but notifications actually go out via Resend email; SMS was never wired up.
- **Animation approach thrash**: CSS `@keyframes` then `requestAnimationFrame` both failed for the drawer (background-tab throttling) before `setTimeout` worked.
- **Tooling false alarms**: a build-chunk scan wrongly reported Turnstile as "not bundled" — a regex that excluded the `()` in App Router route-group paths. Lesson: verify the tool before trusting the conclusion.
- **Cloudinary disorganisation**: images were first uploaded with random public IDs and mixed with demo assets; had to be reorganised into `products/<slug>` and cleaned up.
- **Honesty defects shipped then fixed**: seed data double-branded the meta titles (title-tag bug), the hero advertised a fabricated "4.9 ★ / 600+ orders", and the homepage carried three invented testimonials plus a "Bestselling boxes" heading on a shop with zero orders. All now corrected — the pattern was placeholder marketing copy quietly becoming a factual claim once the site went live.
- **Testing on production data** (2026-08-01): a live rate-limit burst wrote rows to the production `reviews` table because local dev points at prod. Caught and cleaned up immediately, and later verification work was redesigned to use rolled-back transactions and far-future sentinel dates instead. Lesson: check *where* a dev server is pointed before exercising write endpoints against it.
- **A wrong conclusion from a shallow grep**: Twilio was initially recorded as "not wired up" after grepping only a couple of directories. It is in fact fully implemented and called from the notification service — it simply has no credentials configured. Corrected before it reached the README.

## Risks & other notes

**Newly surfaced 2026-08-01 — both still open**

- **Local development reads and writes the PRODUCTION database.** `.env.local` sets `DATABASE_URL` to the live Neon database, so `npm run dev` mutates real data. This bit during testing: a rate-limit burst inserted 6 rows into the live `reviews` table (spotted, verified and deleted; they were `pending` so never public). The app already ships the right mechanism — an embedded PGlite sandbox that engages when `DATABASE_URL` is unset. Fix by pointing local at a Neon branch, or unsetting the variable. Risk grows sharply once real customer orders exist.
- **Next.js has 8 high-severity advisories** (`npm audit`) — DoS via Server Actions, SSRF in rewrites, cache confusion, unauthenticated disclosure of internal Server Function endpoints, plus vulnerable `postcss`/`sharp` transitives. Not upgraded here: `npm audit fix` wants a framework bump, which shouldn't happen unattended on a live site. Should be a deliberate, tested upgrade before taking payments.
- **No ingredient cost data.** `ingredients` tracks name/unit/category/stock but no cost, so gross margin per product is uncomputable. Pricing is currently guesswork.

**Ongoing**

- **Test coverage is unit-only** — 90 tests cover pure logic well, but there is no browser/e2e suite; UI regressions still rely on manual checks.
- **Rate limiting is per-instance** — in-process counters, so on Vercel the limit is per serverless instance, not global. Deliberate trade-off, documented in the module.
- **Pricing not finalised** — a launch blocker and a trust risk if opened prematurely.
- **Public street address in schema** — needed for local SEO but may be a home address; a privacy consideration.
- **Single-maintainer, pre-launch project** with a soft ~September deadline; the engineering queue is now clear, so remaining work is ops/setup and business decisions.
