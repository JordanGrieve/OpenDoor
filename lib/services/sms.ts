// ─────────────────────────────────────────────────────────────
// Twilio SMS — customer notifications + owner new-order alerts.
// No-ops with a log when Twilio env is absent.
// ─────────────────────────────────────────────────────────────
import twilio from "twilio";
import { toE164 } from "@/lib/phone";

type TwilioClient = ReturnType<typeof twilio>;
let _client: TwilioClient | null = null;

function client(): TwilioClient | null {
  if (_client) return _client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  _client = twilio(sid, token);
  return _client;
}

export interface SendSmsResult {
  ok: boolean;
  id: string | null;
  skipped: boolean;
  error?: string;
}

export async function sendSms(to: string, body: string): Promise<SendSmsResult> {
  const c = client();
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!c || !from) {
    console.log(`[sms:skipped] → ${to} · "${body.slice(0, 40)}…" (Twilio not set)`);
    return { ok: false, id: null, skipped: true };
  }
  // Customers type "07700 900123"; Twilio only accepts E.164. Normalise
  // here so a valid UK number doesn't fail silently at the API.
  const e164 = toE164(to);
  if (!e164) {
    console.warn(`[sms:invalid] "${to}" is not a usable phone number — not sent`);
    return { ok: false, id: null, skipped: false, error: "invalid phone number" };
  }
  try {
    const msg = await c.messages.create({ to: e164, from, body });
    return { ok: true, id: msg.sid, skipped: false };
  } catch (err) {
    // Log rather than fail silently — a bad send should be visible.
    console.error(`[sms:failed] → ${e164}: ${(err as Error).message}`);
    return { ok: false, id: null, skipped: false, error: (err as Error).message };
  }
}

export function ownerSmsNumber(): string | null {
  return process.env.OWNER_SMS_NUMBER ?? null;
}

/** All three are needed to actually send — a SID alone sends nothing. */
export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}
