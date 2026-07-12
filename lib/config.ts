// ── Storefront selling switch ─────────────────────────────────
// Pre-launch mode. While false, buy buttons are disabled across the
// storefront and the checkout API refuses orders. Flip to true (and
// redeploy) when you're ready to take orders.
export const SELLING_ENABLED: boolean = false;

// Shown beneath the disabled buy buttons.
export const PRELAUNCH_MESSAGE =
  "We're just setting up shop — we hope to be baking fresh treats for you by September.";
