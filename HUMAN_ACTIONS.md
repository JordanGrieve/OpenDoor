# Human Actions — Open Door Bakery

_Compiled 2026-08-02. Everything here needs **you**, not code._

The engineering backlog is empty and all work is pushed and deployed. What stands between here and taking money is on this list.

**Read this first:** the single most time-critical item is **food business registration** (#1). UK law requires it **28 days before** you trade. If you want to open in September, that clock needs to start now — everything else on this list can be done faster than that one can.

> Never paste secrets (API keys, tokens, passwords) into chat. Put them straight into Vercel or `.env.local`, and just tell me "done".

---

## 🔴 Do now

### 1. Register the food business with South Lanarkshire Council
- **What:** Register Open Door Bakery as a food business with your local authority. Free.
- **Why:** Legally required in the UK for anyone selling food, **at least 28 days before trading**. This is the longest lead time on the list, so it gates the September launch date more than any code does. Nothing else here takes 28 days.
- **How:** Start at [gov.uk/food-business-registration](https://www.gov.uk/food-business-registration), which routes you to South Lanarkshire Council. You'll need the trading address (18 Avonbank, Hamilton ML3 7PD), the type of food, and when you intend to start. Expect an Environmental Health visit and a food hygiene rating afterwards.
- **Effort:** ~30 min to submit · **Urgency: HIGHEST — start today**
- **Asana:** `[Blocker] Register food business with the council (28-day lead time)`

### 2. Put the real Stripe webhook secret into Vercel
- **What:** Set `STRIPE_WEBHOOK_SECRET` to the real `whsec_…` value in Vercel production.
- **Why:** The local value is **2 characters** — a placeholder. If production has the same, Stripe's webhook signature check fails, orders stay stuck at `pending` after payment, and confirmation emails never send. You'd be taking money without confirming orders. Blocks any real selling.
- **How:** [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks → your `opendoorbakery.com/api/webhooks/stripe` endpoint → reveal the signing secret. Paste into Vercel → Project → Settings → Environment Variables → Production. Redeploy. **Don't paste it in chat.**
- **Effort:** ~10 min · **Urgency: HIGH (blocks selling)**
- **Asana:** `[Blocker] Verify Vercel production env vars`

### 3. Confirm Stripe account is fully activated for live payments
- **What:** Check the Stripe account is out of test mode: business details submitted, bank account added for payouts, identity verified.
- **Why:** Live keys existing isn't the same as being able to accept charges. If the account isn't activated, checkout fails at the moment a customer pays — the worst possible place to find out.
- **How:** [dashboard.stripe.com](https://dashboard.stripe.com) → toggle to **Live mode** → look for any "complete your profile"/"activate account" prompts. Confirm payouts show a bank account.
- **Effort:** ~15 min (longer if details are outstanding) · **Urgency: HIGH**
- **Asana:** `[Blocker] Confirm Stripe account activated for live payments`

### 4. Create the Clerk production instance
- **What:** Move the dashboard off Clerk's **development** instance.
- **Why:** `opendoorbakery.com/dashboard` currently redirects to `nice-dog-53.accounts.dev`. Dev instances are rate-limited, show a dev banner, and aren't supported for production. This is the main auth blocker.
- **How:** [dashboard.clerk.com](https://dashboard.clerk.com) → create a **Production** instance for `opendoorbakery.com` → add the DNS records it gives you in Cloudflare (CNAMEs for `clerk`, `accounts`, etc.) → copy `pk_live_…` / `sk_live_…` into Vercel production env vars, replacing the `pk_test_`/`sk_test_` ones → redeploy. Then confirm signing in no longer sends you to `*.accounts.dev`.
- **Effort:** ~45 min + DNS propagation · **Urgency: HIGH**
- **Asana:** `[Blocker] Clerk running on DEV instance in production`

### 5. Verify the remaining Vercel environment variables
- **What:** Confirm these are correct in **Vercel production** (I can only see local values):
  - `EMAIL_FROM` → should be `orders@opendoorbakery.com` (local is still the unbranded `onboarding@resend.dev`)
  - `STRIPE_SECRET_KEY` → the live `sk_live_…`
  - `EMAIL_REPLY_DOMAIN` → local says **`thepastrybox.co.uk`**, a different domain entirely. Intentional or leftover?
- **Why:** Customer emails currently risk going out from a generic Resend test address, which looks like spam and hurts deliverability.
- **How:** Vercel → Project → Settings → Environment Variables → Production. Fix, redeploy, then send yourself a test enquiry from the contact form.
- **Effort:** ~15 min · **Urgency: HIGH**
- **Asana:** `[Blocker] Verify Vercel production env vars`

---

## 🟠 Do soon

### 6. Legal pages: Privacy Policy, Terms, Cancellation/Refunds
- **What:** The site has **no legal pages at all** — no privacy policy, terms, refund policy, or cookie notice, and no links to them in the footer.
- **Why:** You collect names, emails, phone numbers and delivery addresses, so UK GDPR requires a privacy notice. Distance selling requires clear terms and a cancellation/refund policy. Note that **perishable food is generally exempt from the 14-day cooling-off right**, but you still have to say so rather than stay silent. This is a real risk once you take money from the public.
- **How:** Decide the policies (below), then **tell me and I'll build the pages and footer links** — that part is code.
  - Refunds: what happens if a customer cancels late, or isn't happy?
  - Cancellation window: how many days' notice before a collection/delivery date?
  - Data: you use Stripe, Resend, Cloudinary, Clerk, Cloudflare, Postbox — a privacy notice should name these processors.
  - I'm not a lawyer: for a food business taking payments it's worth a quick professional read-through, or a reputable UK template.
- **Effort:** ~1–2 h of decisions, then I write it · **Urgency: MEDIUM-HIGH (before selling)**
- **Asana:** `[Blocker] Legal pages: privacy, terms, refunds`

### 7. Public liability / product liability insurance
- **What:** Get cover appropriate to a home/small food business selling to the public.
- **Why:** Standard for food businesses; some councils and venues expect it. Selling food without it is an uninsured personal risk if someone gets ill.
- **How:** Compare specialist providers (e.g. those covering home bakers/food traders). Have your council registration to hand.
- **Effort:** ~1 h · **Urgency: MEDIUM (before selling)**
- **Asana:** `[Blocker] Arrange public/product liability insurance`

### 8. Create the Google Business Profile
- **What:** Claim and verify the Google Business Profile for Open Door Bakery, Hamilton.
- **Why:** The single biggest factor for showing up when someone searches "hamilton bakery". All the on-page local SEO is already done (LocalBusiness schema, geo coordinates, 12 served towns) — it can't do its job without this. Verification can take **days to weeks**, so start it early.
- **How:** [business.google.com](https://business.google.com) → add business → category "Bakery" → address 18 Avonbank, Hamilton ML3 7PD → verify (usually postcard or phone) → add hours, photos (you have good ones now), and the website URL.
- **Effort:** ~30 min + verification wait · **Urgency: MEDIUM-HIGH (long tail)**
- **Asana:** `[To Do] Create Google Business Profile`

### 9. Set up Google Search Console and submit the sitemap
- **What:** Verify domain ownership and submit `https://opendoorbakery.com/sitemap.xml`.
- **Why:** Until you do, Google indexes you slowly and you're blind to indexing errors. The sitemap already exists and auto-updates with products.
- **How:** [search.google.com/search-console](https://search.google.com/search-console) → add a **Domain** property for `opendoorbakery.com` → verify via a Cloudflare DNS TXT record → Sitemaps → submit `sitemap.xml`.
- **Effort:** ~20 min · **Urgency: MEDIUM**
- **Asana:** `[To Do] Google Search Console + submit sitemap`

### 10. Confirm the business facts published on the site
- **What:** Three things I can't verify for you:
  - **Map pin:** the schema publishes lat `55.76005`, lon `-4.038857`. Does that actually land on 18 Avonbank? A wrong pin hurts local ranking and can fail Google verification.
  - **Email:** `hello@opendoorbakery.com` is published in the structured data. Is that a real, monitored inbox?
  - **Phone + opening hours:** there's no phone number anywhere. Google Business Profile really wants one, and customers expect it.
- **Why:** These are public claims about a real business. Wrong details cost you customers and rankings.
- **How:** Check the coordinates on [google.com/maps](https://www.google.com/maps) (paste `55.76005, -4.038857`). Then reply with the corrections and the phone number, and I'll update `lib/seo.ts` and the footer.
- **Effort:** ~15 min · **Urgency: MEDIUM**
- **Asana:** `[To Do] Confirm business facts`

### 11. Approve the Next.js security upgrade
- **What:** Give me the go-ahead to upgrade Next.js.
- **Why:** `npm audit` reports **8 high-severity advisories** on the installed version — SSRF in rewrites, DoS via Server Actions, cache confusion, unauthenticated disclosure of internal endpoints — plus vulnerable `postcss`/`sharp`. Should be fixed before the site handles card payments.
- **How:** Just reply "do the Next.js upgrade". I'll do it on a branch, run the tests and build, check the storefront and dashboard on a preview deploy, and only merge if clean.
- **Effort:** yours ~0; mine ~1 h · **Urgency: MEDIUM-HIGH (before payments)**
- **Asana:** `[To Do] Next.js security upgrade (8 high-severity advisories)`

---

## 🟡 Decisions needed

### 12. Product pricing — especially Lemon Drizzle Loaf
- **The problem:** **Lemon Drizzle Loaf is £4.00** — cheaper than a single almond croissant (£3.80) and far below market for a whole loaf (typically £12–18). Either the price is wrong or the product is actually a *slice* and the name is misleading.
- Also: celebration box variants don't state size or servings ("Standard" £45 vs "Serves 16–20 (10\")" £60 — a customer can't tell what £45 buys). Bulk discounts vary 8.3%–10.7% with no clear policy.
- **Options:**
  - **(a)** Tell me the corrected prices and I apply them today. Fast, unblocks launch, but still guesswork.
  - **(b)** Let me add ingredient costs first (see #13) so you price from real margins.
  - **(c)** Both — (a) now to unblock, (b) before you scale.
- **Recommendation: (c).** Fix the obviously-wrong prices now so launch isn't held up, then get costs in before you're selling volume and a bad margin compounds.
- **Reply with:** the correct price for Lemon Drizzle Loaf (and whether it's a loaf or a slice), plus what the two celebration box sizes actually contain.
- **Asana:** `[Blocker] Product pricing review — needs your decisions`

### 13. Ingredient costs — build it or not?
- **The problem:** the `ingredients` table records name, unit, category and stock but **no cost**. Your recipes already say what goes into each product, so the only missing piece is a unit cost. Without it, nothing in the app can answer "does this price make money?"
- **Options:**
  - **(a)** I add a `cost_per_unit` field, a cost box in Dashboard → Stock, and a live cost + gross-margin readout beside each product's price. You then enter costs at your own pace.
  - **(b)** Skip it; price on instinct and revisit later.
- **Recommendation: (a), before launch.** The recipe data already exists so this is contained work, and it turns pricing from guesswork into arithmetic. Mispricing is the kind of mistake that silently loses money on every single order.
- **Reply with:** "build ingredient costs" and I'll do it.
- **Asana:** `[To Do] Add ingredient costs so margins can be calculated`

### 14. SMS notifications — configure Twilio or drop it?
- **The problem:** Twilio SMS is **fully coded** (order confirmations, status changes, cancellations, owner new-order alerts) but has **no credentials**, so it silently logs instead of sending. It's a dependency and a documented feature that does nothing.
- **Options:**
  - **(a)** Sign up for Twilio, buy a UK number, add `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` / `OWNER_SMS_NUMBER` to Vercel. Costs a few £/month plus per-message.
  - **(b)** Drop SMS: I remove the dependency and the code, leaving email-only notifications.
- **Recommendation: (b) for launch, (a) later.** Email already covers customer confirmations. SMS is genuinely useful for *your own* new-order alerts, but it's an ongoing cost and another account to manage — not worth blocking launch. Revisit once orders are flowing.
- **Reply with:** "drop SMS" or "set up Twilio".
- **Asana:** `[Blocker] Decide: configure Twilio SMS or remove it`

### 15. Stop local development writing to the production database
- **The problem:** `.env.local` points `DATABASE_URL` at the **live Neon database**, so `npm run dev` reads and writes real data. This already bit once — a test inserted 6 rows into the live reviews table (caught and removed, never public). It gets far more serious once real customer orders exist.
- **Options:**
  - **(a)** Create a Neon **branch** (e.g. `dev`) and point `.env.local` at it. Realistic schema, throwaway data. Free on Neon's plan.
  - **(b)** Remove `DATABASE_URL` from `.env.local` entirely and use the built-in PGlite sandbox. Zero cost, zero risk, slightly less production-like.
- **Recommendation: (a).** Closest to production while making accidents impossible. Takes about 5 minutes in the Neon console.
- **Reply with:** which you'd prefer; for (a) create the branch and put its connection string in `.env.local` yourself (don't paste it in chat).
- **Asana:** `[Blocker] Local dev writes to the PRODUCTION database`

### 16. Birthday Treat Box photo
- **The problem:** it's the only product with **no image**. The one unused stock photo left is a box lid printed **"L'ARTISAN BAKERY"** — a different bakery's branding — so I won't put it on your store.
- **How:** drop a photo into `product-images/` named `birthday-treat-box.png` (or `.jpg`) and tell me. Extra angles can be `birthday-treat-box-2.png`, `-3.png` etc.
- **Worth also doing:** every product currently has exactly one photo. The celebration boxes are your highest-value items (£32–£60) and one photo is thin for that price.
- **Asana:** `[Blocker] Product imagery gaps — needs a Birthday Treat Box photo`

---

## ⏳ Waiting on others (start early, then it's out of your hands)

| Item | Typical wait | Start it in |
|---|---|---|
| Food business registration → Environmental Health visit | **28 days minimum** | #1 |
| Google Business Profile verification (postcard/phone) | days–weeks | #8 |
| Clerk production DNS propagation | minutes–hours | #4 |
| Stripe account activation review (if details outstanding) | 1–3 days | #3 |
| Search Console indexing after sitemap submission | days | #9 |

---

## The critical path to selling

1. Food registration submitted (**28-day clock starts**) → #1
2. Stripe webhook secret + account activation → #2, #3
3. Clerk production instance → #4
4. Pricing decided → #12
5. Legal pages published → #6
6. One live card order + refund, end to end → existing Asana task
7. Flip `SELLING_ENABLED` to `true` in `lib/config.ts` and redeploy → tell me and I'll do it

Everything else improves the business but doesn't block taking a first order.
