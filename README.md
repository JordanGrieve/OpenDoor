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

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run db:reset             # migrate + seed (needs DATABASE_URL)
npm run dev
```

Every external service degrades gracefully when its keys are absent: calls log the intended action instead of failing, so the app runs locally with only `DATABASE_URL`.

### Database scripts

- `npm run db:migrate` — run pending migrations
- `npm run db:seed` — migrate then seed sample data
- `npm run db:reset` — drop schema, migrate, seed (destructive)

## Build status

| Part | Status |
|------|--------|
| 1. Database schema + seed | ✅ done |
| 2. Core public API (products, allergens, slots, delivery, contact) | ✅ done |
| 3. Storefront: home, shop (+allergen filter), product, cart | ✅ done |
| 3. Checkout + Stripe hosted session | 🚧 next |
| 4. Stripe webhook + notifications | 🚧 next |
| 5–8. Dashboard (orders, products, stock, settings, analytics) | 🚧 next |
| 9. Customer accounts (Clerk) + order lookup/cancellation | 🚧 next |
| 10. SEO / responsive polish | ongoing |
```
