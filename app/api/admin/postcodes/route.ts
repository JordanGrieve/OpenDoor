import { NextResponse } from "next/server";
import { addPostcode, listPostcodes } from "@/lib/repos/settings-admin";

export const dynamic = "force-dynamic";

// GET /api/admin/postcodes
export async function GET() {
  return NextResponse.json({ postcodes: await listPostcodes() });
}

// POST /api/admin/postcodes  { prefix }
export async function POST(req: Request) {
  const { prefix } = (await req.json()) as { prefix?: string };
  if (!prefix?.trim()) return NextResponse.json({ error: "Prefix required" }, { status: 400 });
  await addPostcode(prefix.trim());
  return NextResponse.json({ ok: true });
}
