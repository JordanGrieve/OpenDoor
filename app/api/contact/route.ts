import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/services/email";

export const dynamic = "force-dynamic";

// POST /api/contact
// Isolated intake for the contact form, custom-order enquiries and newsletter.
// Contact + custom enquiries become support tickets in Postbox; newsletter
// signups (email only) still just notify the owner by email.
const POSTBOX_URL = () =>
  process.env.POSTBOX_TICKET_URL ||
  "https://postbox.help/api/tickets/cli_62a7282f3eb197a5bbaa6189257ff22b";
const OWNER_EMAIL = () => process.env.OWNER_EMAIL || process.env.EMAIL_FROM || "hello@thepastrybox.co.uk";

interface Intake {
  kind?: "contact" | "custom" | "newsletter";
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  // custom-order extras
  date?: string;
  type?: string;
  people?: string;
  fulfilment?: string;
}

interface PostboxResult {
  status: number;
  ticketId?: number;
  error?: string;
}

async function createTicket(payload: { name: string; email: string; message: string; subject?: string }): Promise<PostboxResult> {
  try {
    const res = await fetch(POSTBOX_URL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      ticket?: { id?: number };
    };
    return { status: res.status, ticketId: json.ticket?.id, error: json.error };
  } catch (err) {
    console.error("[api/contact] Postbox request failed", err);
    return { status: 0, error: (err as Error).message };
  }
}

/** Build a readable ticket body for a custom-order enquiry. */
function customMessage(d: Intake): string {
  const details = [
    d.type && `Type: ${d.type}`,
    d.date && `Date required: ${d.date}`,
    d.people && `Number of people: ${d.people}`,
    d.fulfilment && `Fulfilment: ${d.fulfilment}`,
    d.phone && `Phone: ${d.phone}`,
  ].filter(Boolean);
  return `${d.message || ""}\n\n— Enquiry details —\n${details.join("\n")}`.trim();
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as Intake;
    const kind = data.kind || "contact";

    // Newsletter: email-only signup, not a ticket.
    if (kind === "newsletter") {
      if (!data.email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
      await sendEmail({
        to: OWNER_EMAIL(),
        subject: `Newsletter signup — ${data.email}`,
        html: `<p>New newsletter signup: <b>${data.email}</b></p>`,
      });
      return NextResponse.json({ ok: true });
    }

    // Contact + custom enquiries → Postbox ticket
    const name = data.name?.trim();
    const email = data.email?.trim();
    if (!name) return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
    if (!data.message?.trim()) return NextResponse.json({ error: "Please enter a message." }, { status: 400 });

    const payload =
      kind === "custom"
        ? { name, email, subject: `Custom order enquiry — ${data.type || "general"}`, message: customMessage(data) }
        : { name, email, subject: "Website contact form", message: data.message.trim() };

    const result = await createTicket(payload);

    if (result.status === 201) {
      return NextResponse.json({ ok: true, ticketId: result.ticketId });
    }
    if (result.status === 400) {
      return NextResponse.json({ error: result.error || "Please check your details." }, { status: 400 });
    }
    if (result.status === 429) {
      return NextResponse.json({ error: "We're getting a lot of messages right now — please try again in a moment." }, { status: 429 });
    }
    // network error or unexpected status
    return NextResponse.json({ error: "Couldn't send your message — please try again shortly." }, { status: 502 });
  } catch (err) {
    console.error("[api/contact]", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
