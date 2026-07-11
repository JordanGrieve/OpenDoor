import { NextResponse } from "next/server";
import { createReview } from "@/lib/repos/reviews";
import { verifyTurnstile } from "@/lib/services/turnstile";

export const dynamic = "force-dynamic";

// POST /api/reviews — customer submits a review (stored pending moderation)
export async function POST(req: Request) {
  try {
    const data = (await req.json()) as {
      name?: string;
      email?: string;
      message?: string;
      rating?: number;
      turnstileToken?: string;
    };

    const humanOk = await verifyTurnstile(data.turnstileToken, req.headers.get("x-forwarded-for") || undefined);
    if (!humanOk) return NextResponse.json({ error: "Anti-spam check failed. Please try again." }, { status: 403 });

    if (!data.name?.trim()) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
    if (!data.message?.trim()) return NextResponse.json({ error: "Please write your review." }, { status: 400 });

    await createReview({
      name: data.name,
      email: data.email,
      rating: Number(data.rating) || 5,
      body: data.message,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/reviews]", err);
    return NextResponse.json({ error: "Couldn't submit your review — please try again." }, { status: 500 });
  }
}
