// ─────────────────────────────────────────────────────────────
// Cloudflare Turnstile — bot protection for public forms.
// Server-side token verification. Skips gracefully (returns true)
// when TURNSTILE_SECRET_KEY isn't configured, matching the app's
// other env-driven services.
// ─────────────────────────────────────────────────────────────
const SECRET = () => process.env.TURNSTILE_SECRET_KEY;

export function turnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/** Verify a Turnstile token with Cloudflare. True when disabled or valid. */
export async function verifyTurnstile(token: string | undefined | null, ip?: string): Promise<boolean> {
  const secret = SECRET();
  if (!secret) return true; // not configured → don't block
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.append("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as { success: boolean };
    return Boolean(json.success);
  } catch (err) {
    console.error("[turnstile] verify failed", err);
    return false;
  }
}
