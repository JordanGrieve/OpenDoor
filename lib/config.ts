// ── Storefront selling switch ─────────────────────────────────
// Pre-launch mode. While false, buy buttons are disabled across the
// storefront and the checkout API refuses orders. Flip to true (and
// redeploy) when you're ready to take orders.
export const SELLING_ENABLED: boolean = false;

// Shown beneath the disabled buy buttons.
export const PRELAUNCH_MESSAGE =
  "We're just setting up shop — we hope to be baking fresh treats for you by September.";

// ── Site-wide lock ────────────────────────────────────────────
// While true, the whole storefront sits behind a password screen at
// /lock. The admin dashboard is unaffected — it keeps its own auth.
// Flip to false (and redeploy) to open the site to the public.
export const SITE_LOCKED: boolean = true;

// Headline copy on the lock screen.
export const LOCK_MESSAGE =
  "We're putting the finishing touches to the bakery. Leave your email and you'll be the first to know when the doors open.";

