// ─────────────────────────────────────────────────────────────
// Admin session auth — single owner, one password (env), stateless
// signed cookie. Uses Web Crypto so it works in both the Node route
// handlers and the Edge middleware.
// ─────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "od_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Local-dev fallbacks so the dashboard is reachable without env set.
function secret(): string {
  return process.env.SESSION_SECRET || "dev-session-secret-change-me";
}
export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "opendoor";
}

const TOKEN_MESSAGE = "od-admin-session-v1";

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

/** The signed value stored in the session cookie after a valid login. */
export async function sessionToken(): Promise<string> {
  return hmac(TOKEN_MESSAGE);
}

/**
 * Token proving a Clerk user's email already passed the admin allowlist.
 * Bound to the userId so it can't be reused by a different account, and
 * stored in a short-lived cookie to avoid a Clerk API call on every request.
 */
export async function adminVerifiedToken(userId: string): Promise<string> {
  return hmac(`admin-verified:${userId}`);
}

/** Constant-time-ish validation of a presented cookie token. */
export async function isValidSession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await sessionToken();
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
