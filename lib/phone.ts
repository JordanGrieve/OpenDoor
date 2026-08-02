// UK phone-number normalisation.
//
// Customers type numbers the way they say them ("07700 900123"), but
// Twilio only accepts E.164 ("+447700900123"). Without this, every
// customer SMS fails — and quietly, because the send path swallows the
// error. Normalise at the edge instead.

const DEFAULT_DIALLING_CODE = "44"; // United Kingdom

/**
 * Convert a typed phone number to E.164, or null if it can't be one.
 * Numbers already in international form are preserved as-is.
 */
export function toE164(input: string | null | undefined, diallingCode = DEFAULT_DIALLING_CODE): string | null {
  if (!input) return null;

  // Keep a leading +, drop spaces, dashes, brackets, dots.
  const trimmed = String(input).trim();
  const hadPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length === 0) return null;

  // Already international, e.g. "+33 1 23 45 67 89" or "+44 7700 900123".
  if (hadPlus) return sane(`+${digits}`);

  // "00" international prefix, e.g. "0044 7700 900123".
  if (digits.startsWith("00")) return sane(`+${digits.slice(2)}`);

  // National trunk form, e.g. "07700 900123" -> +447700900123.
  if (digits.startsWith("0")) return sane(`+${diallingCode}${digits.slice(1)}`);

  // Bare country-code form, e.g. "447700900123".
  if (digits.startsWith(diallingCode)) return sane(`+${digits}`);

  // Anything else: assume it's a national number missing its trunk 0.
  return sane(`+${diallingCode}${digits}`);
}

/** E.164 allows at most 15 digits, and a real number needs a few. */
function sane(value: string): string | null {
  const digits = value.slice(1);
  if (digits.length < 8 || digits.length > 15) return null;
  return value;
}

/** True when the value can be turned into a sendable E.164 number. */
export function isDiallable(input: string | null | undefined): boolean {
  return toE164(input) !== null;
}
