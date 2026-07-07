import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/services/email";

export const dynamic = "force-dynamic";

// POST /api/contact
// Isolated intake for contact form, custom-order enquiries and newsletter.
// For now it simply emails the owner. A ticket system replaces this later —
// swap the body of handleIntake() and nothing else changes.
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

async function handleIntake(data: Intake) {
  const kind = data.kind || "contact";
  const subject =
    kind === "custom"
      ? `Custom order enquiry — ${data.name || data.email}`
      : kind === "newsletter"
      ? `Newsletter signup — ${data.email}`
      : `Contact form — ${data.name || data.email}`;

  const lines = Object.entries(data)
    .filter(([, v]) => v)
    .map(([k, v]) => `<b>${k}:</b> ${String(v)}`)
    .join("<br>");

  return sendEmail({
    to: OWNER_EMAIL(),
    subject,
    html: `<h2>${subject}</h2><p>${lines}</p>`,
    replyTo: data.email,
  });
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as Intake;
    if (data.kind !== "newsletter" && !data.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const result = await handleIntake(data);
    return NextResponse.json({ ok: true, delivered: result.ok, skipped: result.skipped });
  } catch (err) {
    console.error("[api/contact]", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
