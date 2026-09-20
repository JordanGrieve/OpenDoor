// ─────────────────────────────────────────────────────────────
// Postbox — contact and custom-order enquiries become support tickets.
//
// The ingestion URL carries a workspace key, so it lives ONLY in
// POSTBOX_TICKET_URL and is never hardcoded here: this repository is
// public, and a working key would let anyone open tickets in the
// bakery's inbox. No-ops with a log when unset, matching the app's
// other env-driven services.
//
// History worth keeping: the contact form was dead for six weeks
// (12 July – 22 August 2026) because the configured key had been
// deleted, Postbox answered 401, and this code discarded the status
// before returning a generic failure. Every non-success is now logged
// with its status and body — that single line is what would have
// identified it on the first submission instead of the six-hundredth.
// ─────────────────────────────────────────────────────────────

export interface TicketPayload {
  name: string;
  email: string;
  message: string;
  subject?: string;
}

export type TicketOutcome =
  | { kind: "created"; ticketId?: number }
  | { kind: "skipped" } // not configured
  | { kind: "invalid"; error?: string } // 400 — caller should surface to the user
  | { kind: "rate-limited" }
  | { kind: "failed"; status: number; detail?: string };

const URL_ENV = () => process.env.POSTBOX_TICKET_URL?.trim();

export function postboxConfigured(): boolean {
  return Boolean(URL_ENV());
}

/**
 * How an HTTP status from the ticket endpoint should be read.
 *
 * Any 2xx counts as created. The endpoint has historically answered 201,
 * but treating only 201 as success means a change to 200 would silently
 * report failure to customers whose tickets had in fact been created.
 */
export function classifyTicketStatus(status: number): TicketOutcome["kind"] {
  if (status >= 200 && status < 300) return "created";
  if (status === 400) return "invalid";
  if (status === 429) return "rate-limited";
  return "failed";
}

/** Open a support ticket. Never throws. */
export async function createTicket(payload: TicketPayload): Promise<TicketOutcome> {
  const url = URL_ENV();
  if (!url) {
    console.warn("[postbox:skipped] POSTBOX_TICKET_URL is not set — enquiry not delivered", {
      subject: payload.subject,
      from: payload.email,
    });
    return { kind: "skipped" };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[postbox] request failed before a response", err);
    return { kind: "failed", status: 0, detail: (err as Error).message };
  }

  // Read the body once, as text, so it can be logged even when it isn't JSON.
  const raw = await res.text().catch(() => "");
  let json: { ok?: boolean; error?: string; ticket?: { id?: number } } = {};
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    /* non-JSON body — `raw` is still logged below */
  }

  const kind = classifyTicketStatus(res.status);
  if (kind === "created") return { kind, ticketId: json.ticket?.id };

  // The line whose absence cost six weeks.
  console.error(`[postbox] ticket not created — HTTP ${res.status}`, raw.slice(0, 500));

  if (kind === "invalid") return { kind, error: json.error };
  if (kind === "rate-limited") return { kind };
  return { kind: "failed", status: res.status, detail: json.error || raw.slice(0, 200) };
}
