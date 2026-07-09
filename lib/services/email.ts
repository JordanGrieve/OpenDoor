// ─────────────────────────────────────────────────────────────
// Resend transactional email.
// All customer emails carry a per-order Reply-To
// (order+ORD-0084@domain) so replies thread against the order.
// No-ops with a log when RESEND_API_KEY is absent.
// ─────────────────────────────────────────────────────────────
import { Resend } from "resend";

let _resend: Resend | null = null;

function client(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

const FROM = () => process.env.EMAIL_FROM || "Open Door Bakery <orders@thepastrybox.co.uk>";
const REPLY_DOMAIN = () => process.env.EMAIL_REPLY_DOMAIN || "thepastrybox.co.uk";

/**
 * Reply-To for order emails. If EMAIL_REPLY_TO is set (e.g. a plain inbox
 * or your ticket-system ingest address) it's used verbatim; otherwise falls
 * back to a per-order threaded address (order+ORD-0084@domain).
 */
export function replyToForOrder(orderNumber: string): string {
  const override = process.env.EMAIL_REPLY_TO?.trim();
  if (override) return override;
  return `order+${orderNumber}@${REPLY_DOMAIN()}`;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  id: string | null;
  skipped: boolean;
  error?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailArgs): Promise<SendResult> {
  const resend = client();
  if (!resend) {
    console.log(`[email:skipped] → ${to} · "${subject}" (RESEND_API_KEY not set)`);
    return { ok: false, id: null, skipped: true };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM(),
      to,
      subject,
      html,
      replyTo,
    });
    if (error) return { ok: false, id: null, skipped: false, error: error.message };
    return { ok: true, id: data?.id ?? null, skipped: false };
  } catch (err) {
    return { ok: false, id: null, skipped: false, error: (err as Error).message };
  }
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
