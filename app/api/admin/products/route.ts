import { NextResponse } from "next/server";
import { listAllProducts, createProduct, type ProductInput } from "@/lib/repos/products-admin";
import { normalizeProductInput, friendlyProductError } from "@/lib/product-input";

export const dynamic = "force-dynamic";

// GET /api/admin/products — list (incl. archived)
export async function GET() {
  try {
    return NextResponse.json({ products: await listAllProducts() });
  } catch (err) {
    console.error("[admin/products GET]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

// POST /api/admin/products — create
export async function POST(req: Request) {
  try {
    const input = normalizeProductInput((await req.json()) as Partial<ProductInput>);
    if (!input.name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!input.slug.trim()) return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    const product = await createProduct(input);
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: friendlyProductError(err) }, { status: 400 });
  }
}
