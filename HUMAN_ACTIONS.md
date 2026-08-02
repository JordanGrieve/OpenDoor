# Human Actions — Open Door Bakery

_Compiled 2026-08-02 (updated). Everything here needs **you**, not code._

The engineering backlog is empty, the working tree is clean and everything is pushed to `main`. What stands between here and taking money is on this list.

**Read this first:** the single most time-critical item is **food business registration** (#1). UK law requires it **28 days before** you trade. If you want to open in September, that clock needs to start now — every other item on this list can be finished faster than that one can.

> Never paste secrets (API keys, tokens, passwords) into chat. Put them straight into Vercel or `.env.local`, and just tell me "done".

### What changed since the last version of this file

- ✅ **Ingredient costs are built** (`0005_ingredient_costs`, `lib/margin.ts`, Dashboard → Stock). That's no longer a decision — it's now a data-entry job for you (#12).
- ✅ **Local dev no longer touches production.** `.env.local` now sets `PROD_DATABASE_URL`, so `npm run dev` uses the PGlite sandbox. Hazard closed.
- ✅ **Twilio decision made** ("set up Twilio"), and a silent-failure bug was fixed first (`41c6759`). It's now an account-signup action (#6), not a decision.
- ⚠️ **Next.js advisories are down to 3, not 8**, and `npm audit` reports a fix is available (#14).
- 🆕 **Turnstile anti-spam may be switched off in production** — newly spotted, folded into #5.

---

## 🔴 Do now

### 1. Register the food business with South Lanarkshire Council
- **What:** Register Open Door Bakery as a food business with your local authority. Free.
- **Why:** Legally required in the UK for anyone selling food, **at least 28 days before trading**. This is the longest lead time on the project and it gates the September launch more than any code does.
- **How:** Start at [gov.uk/food-business-registration](https://www.gov.uk/food-business-registration), which routes you to South Lanarkshire Council. You'll need the trading address (18 Avonbank, Hamilton ML3 7PD), the type of food business, and your intended start date. Expect an Environmental Health visit and a hygiene rating afterwards.
- **Effort:** ~30 min to submit · **Urgency: HIGHEST — start today**
- **Asana:** `[Blocker] Register food business with the council (28-day lead time)`

### 2. Put the real Stripe webhook secret into Vercel
- **What:** Set `STRIPE_WEBHOOK_SECRET` to the real `whsec_…` value in Vercel production.
- **Why:** The local value is a 2-character placeholder. If production has the same, Stripe's signature check fails, paid orders stay stuck at `pending`, and confirmation emails never send — you'd be taking money without confirming orders.
- **How:** [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks → your `opendoorbakery.com/api/webhooks/stripe` endpoint → reveal the signing secret. Paste into Vercel → Settings → Environment Variables → Production. Redeploy.
- **Effort:** ~10 min · **Urgency: HIGH (blocks selling)**
- **Asana:** `[Blocker] Verify Vercel production env vars`

### 3. Confirm the Stripe account is activated for live payments
- **What:** Check the account is out of test mode — business details submitted, bank account added for payouts, identity verified.
- **Why:** Having live keys is not the same as being able to accept charges. If the account isn't activated, checkout fails at the exact moment a customer pays.
- **How:** [dashboard.stripe.com](https://dashboard.stripe.com) → switch to **Live mode** → clear any "complete your profile" / "activate account" prompts → confirm Payouts shows a connected bank account.
- **Effort:** ~15 min (longer if details are outstanding) · **Urgency: HIGH**
- **Asana:** `[Blocker] Confirm Stripe account activated for live payments`

### 4. Create the Clerk production instance
- **What:** Move the dashboard off Clerk's **development** instance.
- **Why:** **Verified live today** — `opendoorbakery.com/dashboard` returns a 307 to `nice-dog-53.accounts.dev`. Dev instances are rate-limited, show a dev banner and aren't supported for production. This is the main auth blocker.
- **How:** [dashboard.clerk.com](https://dashboard.clerk.com) → create a **Production** instance for `opendoorbakery.com` → add the DNS records it gives you in Cloudflare (CNAMEs for `clerk`, `accounts`, etc.) → put `pk_live_…` / `sk_live_…` into Vercel production, replacing the `pk_test_`/`sk_test_` values → redeploy. Confirm signing in no longer leaves opendoorbakery.com.
- **Effort:** ~45 min + DNS propagation · **Urgency: HIGH**
- **Asana:** `[Blocker] Clerk running on DEV instance in production`

### 5. Verify the remaining Vercel environment variables
I can only see local values, so these need your eyes in Vercel → Settings → Environment Variables → **Production**:

| Variable | What it should be | Why it matters |
|---|---|---|
| `EMAIL_FROM` | `orders@opendoorbakery.com` | Local is still the unbranded `onboarding@resend.dev`, which only delivers to you and looks like spam |
| `STRIPE_SECRET_KEY` | the live `sk_live_…` | Test keys mean no real charges |
| `EMAIL_REPLY_DOMAIN` | ? | Local says **`thepastrybox.co.uk`** — a different business entirely. Leftover from the mockup, or intentional? |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | real Cloudflare Turnstile keys | 🆕 **Both are absent locally.** Turnstile **fails open** by design (`lib/services/turnstile.ts` returns `true` when unconfigured), so if these are missing in Vercel your contact, custom-order, photo and review forms have **no spam protection at all** |
| `POSTBOX_TICKET_URL`, `EMAIL_REPLY_TO` | as intended | Also absent locally — confirm production has them |

- **How:** For Turnstile: [dash.cloudflare.com](https://dash.cloudflare.com) → Turnstile → Add widget for `opendoorbakery.com` → copy the site key and secret key into Vercel. Then redeploy and send yourself a test enquiry from the contact form.
- **Effort:** ~20 min · **Urgency: HIGH**
- **Asana:** `[Blocker] Verify Vercel production env vars`

### 6. Start the Twilio signup + UK regulatory bundle
- **What:** You chose "set up Twilio". The code is finished and tested; the account is yours to create.
- **Why:** Flagged here rather than under "do soon" purely because of the lead time — **UK numbers need a Twilio Regulatory Bundle (proof of business address) which can take days to approve.** Start it early or it won't be ready for launch. It should **not** block launch: email already covers customer confirmations.
- **How:**
  1. Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio) and add billing.
  2. Buy a UK SMS-capable number (Phone Numbers → Buy a number → United Kingdom → tick SMS), ~£1–2/month plus pennies per message. *Alternative:* an **Alphanumeric Sender ID** ("OpenDoor") is instant and cheaper, but customers can't reply. Either works — it goes in `TWILIO_FROM_NUMBER` the same way.
  3. Add **all four** to Vercel Production: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `OWNER_SMS_NUMBER` (your mobile, `+44…`).
  4. Redeploy and tell me — I'll verify a real send end to end.
- **Effort:** ~30 min + bundle approval wait · **Urgency: MEDIUM-HIGH (lead time only)**
- **Asana:** `[Blocker] Set up Twilio — code ready, needs your account + keys`

---

## 🟠 Do soon

### 7. Legal pages: Privacy Policy, Terms, Cancellation/Refunds
- **What:** Confirmed today — the site has **no legal pages at all** and no footer links to any.
- **Why:** You collect names, emails, phone numbers and delivery addresses, so UK GDPR requires a privacy notice. Distance selling requires clear terms and a cancellation/refund policy. **Perishable food is generally exempt from the 14-day cooling-off right — but you have to say so rather than stay silent.** A real risk once you take money from the public.
- **How:** The decisions are yours; the pages are my job. I need:
  - Refunds — what happens if a customer cancels late, or isn't happy?
  - Cancellation window — how many days' notice before a collection/delivery date? (The app already enforces a 12-hour cancellation window; the policy should match or you'll contradict your own code.)
  - Confirmation that naming these processors is right: Stripe, Resend, Cloudinary, Clerk, Cloudflare, Postbox, Twilio.
  - I'm not a lawyer — for a food business taking payments this is worth a professional read-through or a reputable UK template.
- **Effort:** ~1–2 h of decisions, then I write it · **Urgency: MEDIUM-HIGH (before selling)**
- **Asana:** `[Blocker] Legal pages: privacy, terms, refunds`

### 8. Public liability / product liability insurance
- **What:** Cover appropriate to a small/home food business selling to the public.
- **Why:** Standard for food businesses, and some councils and venues expect to see it. Selling food without it is an uninsured personal risk if someone becomes ill.
- **How:** Compare specialist providers covering home bakers / food traders. Have your council registration (#1) to hand — insurers usually ask.
- **Effort:** ~1 h · **Urgency: MEDIUM (before selling)**
- **Asana:** `[Blocker] Arrange public/product liability insurance`

### 9. Create the Google Business Profile
- **What:** Claim and verify the profile for Open Door Bakery, Hamilton.
- **Why:** The single biggest factor for ranking on "hamilton bakery". All the on-page local SEO is already done (LocalBusiness schema, geo coordinates, 12 served towns) — it can't do its job without this. Verification takes **days to weeks**, so start early.
- **How:** [business.google.com](https://business.google.com) → add business → category "Bakery" → 18 Avonbank, Hamilton ML3 7PD → verify (postcard or phone) → add hours, photos and the website URL.
- **Effort:** ~30 min + verification wait · **Urgency: MEDIUM-HIGH (long tail)**
- **Asana:** `[To Do] Create Google Business Profile`

### 10. Google Search Console + submit the sitemap
- **What:** Verify domain ownership and submit `https://opendoorbakery.com/sitemap.xml`.
- **Why:** Until you do, Google indexes you slowly and you're blind to indexing errors. The sitemap already exists and auto-updates with products.
- **How:** [search.google.com/search-console](https://search.google.com/search-console) → add a **Domain** property → verify via a Cloudflare DNS TXT record → Sitemaps → submit `sitemap.xml`.
- **Effort:** ~20 min · **Urgency: MEDIUM**
- **Asana:** `[To Do] Google Search Console + submit sitemap`

### 11. Confirm the business facts the site publishes as truth
Four public claims I can't verify for you:

- **Map pin** — schema publishes lat `55.76005`, lon `-4.038857`. Does that land on 18 Avonbank? Paste `55.76005, -4.038857` into [google.com/maps](https://www.google.com/maps). A wrong pin hurts ranking and can fail Google verification.
- **Email** — `hello@opendoorbakery.com` is in the structured data. Is that a real, monitored inbox?
- **Opening hours** — the site publishes **Tue–Fri 08:00–14:00 and Sat–Sun 08:00–13:00**. These look like placeholder values from the original mockup, and they're now a factual claim to customers and to Google. Are they right?
- **Phone** — confirmed today: there is **no phone number anywhere** in the codebase. Google Business Profile really wants one and customers expect it.

- **Reply with:** the corrections, the real hours and a phone number, and I'll update `lib/seo.ts` and the footer.
- **Effort:** ~15 min · **Urgency: MEDIUM**
- **Asana:** `[To Do] Confirm business facts`

### 12. Enter your ingredient costs
- **What:** Now that the feature exists, fill in `cost per unit` for each ingredient in **Dashboard → Stock**.
- **Why:** This is the input that turns pricing (#13) from guesswork into arithmetic. The recipes are already entered, so as soon as costs go in, the product editor shows cost and gross margin next to every variant price. Nothing computes until you type the numbers.
- **How:** Dashboard → Stock → cost field on each ingredient row. Use whatever unit the ingredient is recorded in (per kg, per litre, per egg). Rough supermarket prices are fine to start — approximate costs beat none.
- **Effort:** ~30–45 min · **Urgency: MEDIUM-HIGH (gates good pricing)**
- **Asana:** `[To Do] Enter ingredient costs in Dashboard → Stock`

---

## 🟡 Decisions needed

### 13. Product pricing — especially Lemon Drizzle Loaf
- **The problem:** **Lemon Drizzle Loaf is £4.00** — cheaper than a single almond croissant (£3.80) and far below market for a whole loaf (typically £12–18). Either the price is wrong, or it's actually a *slice* and the name is misleading.
- Also: celebration box variants don't state size or servings ("Standard" £45 vs "Serves 16–20 (10\")" £60 — a customer can't tell what £45 buys). Bulk discounts vary 8.3%–10.7% with no stated policy.
- **What changed:** the cost/margin tooling that was missing now exists. Do #12 first and this decision becomes evidence-based instead of a guess.
- **Options:**
  - **(a)** Tell me corrected prices now and I apply them today — fast, but still guesswork.
  - **(b)** Enter ingredient costs (#12) first, then price off real margins.
  - **(c)** Both — (a) to unblock, (b) before you scale.
- **Recommendation: (c).** Fix the obviously-wrong prices now so launch isn't held up, then set the rest from margins before volume makes a bad price expensive.
- **Reply with:** the correct price for Lemon Drizzle Loaf (and whether it's a loaf or a slice), plus what the two celebration box sizes actually contain.
- **Asana:** `[Blocker] Product pricing review — needs your decisions`

### 14. Approve the Next.js security upgrade
- **What:** Give me the go-ahead to upgrade.
- **Why:** Re-checked today — `npm audit` now reports **3 high-severity advisories, not 8** (Next.js image-optimisation DoS + unauthenticated disclosure of internal Server Function endpoints, plus vulnerable `postcss` and `sharp`), and reports a fix is available. Installed Next is `15.5.20`. Still worth clearing before the site handles card payments.
- **How:** Reply **"do the Next.js upgrade"**. I'll branch, upgrade, run the 125 tests and a build, check the storefront and dashboard on a preview deploy, and only merge if clean.
- **Effort:** yours ~0; mine ~1 h · **Urgency: MEDIUM-HIGH (before payments)**
- **Asana:** `[To Do] Next.js security upgrade`

### 15. Birthday Treat Box photo
- **The problem:** it's the only product with **no image**. The one unused stock photo left is a box lid printed **"L'ARTISAN BAKERY"** — another bakery's branding — so I won't put it on your store.
- **How:** drop a photo into `product-images/` named `birthday-treat-box.png` (or `.jpg`) and tell me. Extra angles can be `birthday-treat-box-2.png`, `-3.png`.
- **Worth also doing:** every product has exactly one photo. The celebration boxes are your highest-value items (£32–£60) and one photo is thin at that price.
- **Asana:** `[Blocker] Product imagery gaps — needs a Birthday Treat Box photo`

---

## ⏳ Waiting on others (start early, then it's out of your hands)

| Item | Typical wait | Start it in |
|---|---|---|
| Food business registration → Environmental Health visit | **28 days minimum** | #1 |
| Google Business Profile verification (postcard/phone) | days–weeks | #9 |
| Twilio UK regulatory bundle approval | days | #6 |
| Stripe account activation review (if details outstanding) | 1–3 days | #3 |
| Clerk production DNS propagation | minutes–hours | #4 |
| Search Console indexing after sitemap submission | days | #10 |

---

## The critical path to selling

1. Food registration submitted — **28-day clock starts** → #1
2. Stripe webhook secret + account activation → #2, #3
3. Clerk production instance → #4
4. Production env vars verified, including Turnstile → #5
5. Ingredient costs entered → pricing decided → #12, #13
6. Legal pages published → #7
7. One live card order + refund, end to end → `[To Do] Live Stripe test order + refund`
8. Flip `SELLING_ENABLED` to `true` in `lib/config.ts` and redeploy → tell me and I'll do it

Everything else improves the business but doesn't block taking a first order.
