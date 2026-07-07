import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/repos/products";

export const dynamic = "force-dynamic";

// GET /api/products/:slug — full product for the detail page.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product || product.archived) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (err) {
    console.error("[api/products/:slug]", err);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}
