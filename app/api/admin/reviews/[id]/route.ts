import { NextResponse } from "next/server";
import { setReviewStatus } from "@/lib/repos/reviews";

export const dynamic = "force-dynamic";

// PATCH /api/admin/reviews/:id  { status: approved | rejected | pending }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = (await req.json()) as { status: "approved" | "rejected" | "pending" };
    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await setReviewStatus(Number(id), status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/reviews PATCH]", err);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
