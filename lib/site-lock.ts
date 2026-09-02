// ─────────────────────────────────────────────────────────────
// Site-wide "coming soon" lock.
//
// Deliberately separate from the admin session in lib/auth.ts: the
// lock password is shared with anyone previewing the site, so holding
// it must never grant dashboard access. Different cookie, different
// signed message, different env var.
// ─────────────────────────────────────────────────────────────

export const LOCK_COOKIE = "od_lock";
export const LOCK_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Paths that stay reachable while the site is locked. Everything listed
 * here is public to the world, so keep it tight and justified.
 */
const EXEMPT_PREFIXES = [
  "/lock", // the lock screen itself
  "/api/lock", // its password check
  "/api/contact", // newsletter signup on the lock screen
  "/api/webhooks", // Stripe must still be able to reach us
  "/_next", // framework assets
];

const EXEMPT_EXACT = ["/robots.txt", "/sitemap.xml", "/favicon.ico"];

/** True when a path must remain reachable with no lock session. */
export function isLockExempt(pathname: string): boolean {
  if (EXEMPT_EXACT.includes(pathname)) return true;
  return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Where to send someone after they unlock. Only same-site paths are
 * honoured, so a crafted `?from=` can't bounce a visitor off-site.
 */
export function safeReturnPath(from: string | null | undefined): string {
  if (!from) return "/";
  if (!from.startsWith("/") || from.startsWith("//")) return "/";
  if (isLockExempt(from)) return "/";
  return from;
}
