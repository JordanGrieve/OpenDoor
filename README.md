# Open Door Bakery

An online-only artisan bakery platform — customer storefront, Clerk-gated admin dashboard, and backend API in a single Next.js (App Router) app. Live at [opendoorbakery.com](https://opendoorbakery.com).

> **Pre-launch.** `SELLING_ENABLED` in `lib/config.ts` is currently `false`: buy buttons are disabled across the storefront and `POST /api/checkout/session` returns `503`. Flip it to `true` and redeploy to start taking orders.

## Stack

- **Next.js** (App Router) on **Vercel**
- **Neon** (Postgres) — schema + migrations owned in `/db`
- **Stripe Checkout** (hosted) — card payments + automatic refunds
- **Resend** — transactional email (order confirmations, status changes)
- **Cloudinary** — product image storage/delivery (`open-door/products/<slug>`, served with `f_auto,q_auto`)
- **Clerk** — gates the **admin dashboard** via an email allowlist (`ADMIN_ALLOWED_EMAILS`)
- **Cloudflare Turnstile** — anti-spam on public forms
- **Postbox** — contact + custom-order enquiries become support tickets
- **Twilio** — SMS notifications; implemented in `lib/services/sms.ts` but **not currently configured** (no `TWILIO_*` env set), so it logs and no-ops

## Structure

```
/app              Storefront (public pages, route group "(store)")
/app/dashboard    Admin dashboard (Clerk-gated)
/app/api          Public + storefront API routes
/app/api/admin    Admin routes (behind middleware)
/db               Schema, migrations, seed data
/lib              Shared types, service clients, data access
/components       Shared UI components
/tests            Vitest unit tests
/scripts          One-off maintenance scripts (e.g. bulk image import)
```

The `Product` type in `lib/types.ts` is the single source of truth for products across storefront and dashboard.

## Local setup

Zero-config — runs with **no database or keys** thanks to an embedded Postgres fallback:

```bash
npm install
npm run dev        # open http://localhost:3000
```

When `DATABASE_URL` is not set, the app boots an in-process **PGlite** (WASM Postgres), auto-creates the schema and seeds sample data on first request. Every external service (Stripe, Resend, Twilio, Cloudinary, Clerk, Turnstile) degrades gracefully when its keys are absent — calls log the intended action instead of failing, and checkout confirms orders directly without Stripe.

> ⚠️ **`DATABASE_URL` in `.env.local` currently points at the production Neon database**, so `npm run dev` reads *and writes live data*. Use a Neon branch for local work, or leave `DATABASE_URL` unset to get the PGlite sandbox above.

For a real database:

```bash
cp .env.example .env.local   # add DATABASE_URL (Neon) + any keys you have
npm run db:reset             # migrate + seed
npm run dev
```

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Migrate then seed sample data |
| `npm run db:reset` | Drop schema, migrate, seed (destructive) |

## Tests

Vitest, in `/tests`. Covers the pure logic most at risk of silent breakage: money/pence rounding, fulfilment dates, delivery-postcode district matching, product-input normalisation, SEO JSON-LD, rate limiting and collection-slot capacity.

```bash
npm test
```

There is no browser/e2e suite yet — UI changes are verified manually against a running server.

## Build status

| Part | Status |
|------|--------|
| 1. Database schema + migrations + seed | ✅ done |
| 2. Core public API (products, allergens, slots, delivery, contact) | ✅ done |
| 3. Storefront: home, shop (+allergen filter), product, cart | ✅ done |
| 3. Checkout + Stripe hosted session | ✅ done |
| 4. Stripe webhook + notifications (email; SMS coded, unconfigured) | ✅ done |
| 5. Dashboard: auth, order queue, order detail, B2B orders | ✅ done |
| 6. Dashboard: product CRUD (variants, recipes, images, availability) | ✅ done |
| 7. Dashboard: stock + auto shopping list | ✅ done |
| 8. Dashboard: settings + analytics + CSV export | ✅ done |
| 9. Guest order lookup/cancel + reorder | ✅ done |
| 10. SEO (sitemap/robots/metadata/JSON-LD) + responsive | ✅ done |
| 11. Moderated customer reviews | ✅ done |
| 12. Anti-spam (Turnstile) + Postbox enquiry tickets | ✅ done |
| 13. Unit test suite (Vitest) | ✅ done |
| 14. API rate limiting | ✅ done |
| 15. Collection-slot capacity limits | ✅ done |

## Admin access

The dashboard is gated by **Clerk** plus an email allowlist:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — Clerk instance
- `ADMIN_ALLOWED_EMAILS` — comma-separated allowlist; anyone else is redirected to `/dashboard/denied`
- `SESSION_SECRET` — signs a short-lived cookie so the allowlist check isn't re-run on every request

If no Clerk publishable key is set, middleware falls back to a password session at `/dashboard/login` using `ADMIN_PASSWORD`. That fallback is for local development — production uses Clerk.

> ⚠️ Production is currently pointed at a Clerk **development** instance (sign-in redirects to `*.accounts.dev`). A production Clerk instance with `pk_live_`/`sk_live_` keys is needed before launch.

## Notes

- Card data never touches this app — Stripe hosted Checkout only. Orders are created `pending` at session creation and confirmed by the webhook (a dev fallback confirms directly when Stripe keys are absent).
- Delivery is matched on the **outward postcode district** (`ML3 7PD` → `ML3`), so `ML10` correctly does *not* match `ML1`.
- Collection slots support an optional per-day `capacity`; blank means unlimited. Capacity is re-checked server-side at checkout, not just in the UI.
- Rate limiting (`lib/rate-limit.ts`) is in-process, so on Vercel it is per serverless instance rather than global. It blunts single-IP floods; a shared store (Vercel KV / Upstash) would be needed for a hard guarantee.
