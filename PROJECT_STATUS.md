# Open Door Bakery — Project Status

_Last updated: 2026-08-01_

## Overview

Open Door Bakery is an online-only artisan bakery platform for a Hamilton (Scotland) baker — a single Next.js (App Router) app containing the customer storefront, a Clerk-gated admin dashboard, and the backend API. It is built (feature-complete for an MVP), deployed live at **opendoorbakery.com** on Vercel with Neon Postgres, Stripe, Resend, Cloudinary, Clerk, Postbox and Cloudflare Turnstile all wired in. It is **not yet selling**: the site is deliberately in a "pre-launch" mode (buy buttons disabled, checkout API blocked) while pricing is finalised and a few launch-blocking setup tasks are completed. Target go-live is around **September 2026**.

## Where we are now

The product works end-to-end and is deployed. Recent effort has been a wave of mobile-UI polish, an honesty/SEO clean-up, and a full state audit. Today's session purged test data, reorganised the Cloudinary bucket, fixed SEO defects, and switched the store into pre-launch mode. What stands between "built" and "selling" is now mostly **owner/ops work** (Clerk production instance, Vercel env verification, Google Business Profile) plus a pricing review — not code.

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

## In progress

- **Launch prep** — flipping from pre-launch to selling (blocked on the items below).
- **Pricing review** — owner flagged that some product prices "may be weird"; needs a pass before selling.
- **Product imagery** — most products have photos; Birthday Treat Box has none, and gallery/secondary images are sparse.

## Remaining work

- **Clerk production instance** — currently running on a **development** instance in production (redirects to `*.accounts.dev`). Needs a prod instance + DNS + `pk_live_/sk_live_` in Vercel.
- **Verify Vercel env vars** — `EMAIL_FROM` (should be `orders@opendoorbakery.com`, local still `resend.dev`), `STRIPE_WEBHOOK_SECRET` (local is a 2-char placeholder), `STRIPE_SECRET_KEY` (live), and confirm `EMAIL_REPLY_DOMAIN` (`thepastrybox.co.uk`?) is intentional.
- **Google Business Profile** — not created; the single biggest factor for ranking on "hamilton bakery".
- **Google Search Console** — verify domain, submit sitemap.
- **Replace/hide fake testimonials** — the "What locals say" section still shows 3 fabricated named reviews.
- **Confirm business facts** — verify the map pin (lat 55.76005 / lon -4.038857) lands on 18 Avonbank; confirm `hello@opendoorbakery.com` is a monitored inbox; add a real phone number and opening hours.
- **Pre-launch → live Stripe test** — one real card order + refund before opening.
- **Deferred features** — automated tests, rate limiting, collection-slot capacity limits.

## Blockers

- **Clerk is on a dev instance in production** — the main auth blocker for a clean launch.
- **Production env values can't be verified from the code** — needs the owner to confirm in Vercel.
- **Selling intentionally disabled** until pricing is reviewed (self-imposed, correct).
- **Google Business Profile / Search Console are owner actions** and not started — GEO ranking can't begin without them.

## Successes

- **Zero-config local dev**: the app boots with no database and no keys thanks to an in-process PGlite fallback; every external service degrades gracefully (logs the intended action instead of failing).
- **Dashboard exceeds MVP**: analytics, B2B orders, stock, a shopping-list generator and CSV export are all built and working.
- **Robust drawer animation fix**: the preview/background browser tab pauses CSS animations *and* `requestAnimationFrame`; switching the menu mount-transition to `setTimeout` fixed a genuinely subtle bug.
- **Solid auth architecture**: Clerk + allowlist + signed-cookie fast-path, with a password fallback — well factored.
- **Clean data + green types**: no orphaned rows, TypeScript passes throughout, and every change this session was verified live in a real browser rather than assumed.

## Failures & lessons learned

- **Cloudflare Images → Cloudinary**: the original image plan (Cloudflare Images, still named in the README) was dropped for Cloudinary. README is now stale.
- **Twilio SMS abandoned (for now)**: Twilio is still a dependency and in the README, but notifications actually go out via Resend email; SMS was never wired up.
- **Animation approach thrash**: CSS `@keyframes` then `requestAnimationFrame` both failed for the drawer (background-tab throttling) before `setTimeout` worked.
- **Tooling false alarms**: a build-chunk scan wrongly reported Turnstile as "not bundled" — a regex that excluded the `()` in App Router route-group paths. Lesson: verify the tool before trusting the conclusion.
- **Cloudinary disorganisation**: images were first uploaded with random public IDs and mixed with demo assets; had to be reorganised into `products/<slug>` and cleaned up.
- **Honesty defects shipped then fixed**: seed data double-branded the meta titles (title-tag bug), and the hero advertised a fabricated "4.9 ★ / 600+ orders" — both corrected; fake testimonials still remain.

## Risks & other notes

- **No automated tests** — all verification is manual/browser-based; regressions could slip in silently.
- **Stale README** — mentions Cloudflare Images, Twilio SMS, and a "password-protected" dashboard (it's Clerk now); worth refreshing before handover.
- **Pricing not finalised** — a launch blocker and a trust risk if opened prematurely.
- **Fake testimonials live** — an honesty/consumer-law risk until replaced with real reviews or hidden.
- **Public street address in schema** — needed for local SEO but may be a home address; a privacy consideration.
- **Single-maintainer, pre-launch project** with a soft ~September deadline; most remaining work is ops/setup, not engineering.
