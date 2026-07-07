import { NextResponse } from "next/server";
import { getProductById } from "@/lib/repos/products";
import { updateProduct, archiveProduct, getProductRecipes } from "@/lib/repos/products-admin";
import { normalizeProductInput, friendlyProductError } from "@/lib/product-input";
import type { ProductInput } from "@/lib/repos/products-admin";

export const dynamic = "force-dynamic";

// GET /api/admin/products/:id — full product + per-variant recipes
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const recipes = await getProductRecipes(product.id);
  return NextResponse.json({ product, recipes });
}

// PUT /api/admin/products/:id — update
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = normalizeProductInput((await req.json()) as Partial<ProductInput>);
    if (!input.name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const product = await updateProduct(Number(id), input);
    return NextResponse.json({ product });
  } catch (err) {
    return NextResponse.json({ error: friendlyProductError(err) }, { status: 400 });
  }
}

// DELETE /api/admin/products/:id — soft delete (archive)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await archiveProduct(Number(id), true);
  return NextResponse.json({ ok: true });
}
