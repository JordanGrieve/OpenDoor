# Open Door Bakery

An online-only artisan bakery platform — customer storefront, password-protected admin dashboard, and backend API in a single Next.js (App Router) app.

## Stack

- **Next.js** (App Router) on **Vercel**
- **Neon** (Postgres) — schema + migrations owned in `/db`
- **Stripe Checkout** (hosted) — retail card payments + automatic refunds
- **Resend** — transactional email
- **Twilio** — SMS (customer + owner alerts)
- **Cloudflare Images** — product image storage/delivery
- **Clerk** — optional customer accounts (storefront only)

## Structure

```
/app              Storefront (public pages, route group "(store)")
/app/dashboard    Admin dashboard (password protected)   ← in progress
/app/api          Public + storefront API routes
/app/api/admin    Admin routes (behind session middleware) ← in progress
/db               Schema, migrations, seed data
/lib              Shared types, service clients, data access
/components       Shared UI components
```

The `Product` type in `lib/types.ts` is the single source of truth for products across storefront and dashboard.

## Local setup

Zero-config — runs with **no database or keys** thanks to an embedded Postgres fallback:

```bash
npm install
npm run dev        # open http://localhost:3000
```

When `DATABASE_URL` is not set, the app boots an in-process **PGlite** (WASM Postgres), auto-creates the schema and seeds sample data on first request. Set `DATABASE_URL` to a Neon connection string to use the real database (production always does). Every external service (Stripe, Resend, Twilio, Cloudflare, Clerk) degrades gracefully when its keys are absent — calls log the intended action instead of failing, and checkout confirms orders directly without Stripe.

For a real database:

```bash
cp .env.example .env.local   # add DATABASE_URL (Neon) + any keys you have
npm run db:reset             # migrate + seed
npm run dev
```

### Database scripts

- `npm run db:migrate` — run pending migrations
- `npm run db:seed` — migrate then seed sample data
- `npm run db:reset` — drop schema, migrate, seed (destructive)

## Build status

| Part | Status |
|------|--------|
| 1. Database schema + migrations + seed | ✅ done |
| 2. Core public API (products, allergens, slots, delivery, contact) | ✅ done |
| 3. Storefront: home, shop (+allergen filter), product, cart | ✅ done |
| 3. Checkout + Stripe hosted session | ✅ done |
| 4. Stripe webhook + notifications (email/SMS + owner alerts) | ✅ done |
| 5. Dashboard: auth, order queue, order detail, B2B orders | ✅ done |
| 6. Dashboard: product CRUD (variants, recipes, images, availability) | ✅ done |
| 7. Dashboard: stock + auto shopping list | ✅ done |
| 8. Dashboard: settings + analytics + CSV export | ✅ done |
| 9. Customer accounts (Clerk, optional) + reorder + lookup/cancel | ✅ done |
| 10. SEO (sitemap/robots/metadata) + allergen filters + responsive | ✅ done |

### Admin access
`/dashboard/login` — password from `ADMIN_PASSWORD` (defaults to `opendoor` in dev). Single owner, one password.

### Notes
- Customer accounts (Clerk) are optional and only appear when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set; guest checkout is always the default.
- Card data never touches this app — Stripe hosted Checkout only. Orders are created `pending` at session creation and confirmed by the webhook (a dev fallback confirms directly when Stripe keys are absent).
```
