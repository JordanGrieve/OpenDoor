// Normalisation + error mapping for the admin product editor payload.
import type { ProductInput } from "@/lib/repos/products-admin";

export function normalizeProductInput(b: Partial<ProductInput>): ProductInput {
  return {
    name: (b.name ?? "").trim(),
    slug: (b.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""),
    description: b.description ?? "",
    category: (b.category ?? "Other").trim() || "Other",
    price: Number(b.price) || 0,
    leadTimeDays: Math.max(0, Number(b.leadTimeDays) || 0),
    celebration: Boolean(b.celebration),
    metaTitle: b.metaTitle?.trim() || null,
    metaDescription: b.metaDescription?.trim() || null,
    allergenIds: Array.isArray(b.allergenIds) ? b.allergenIds.map(Number) : [],
    variants: Array.isArray(b.variants)
      ? b.variants
          .filter((v) => v && v.label?.trim())
          .map((v, i) => ({
            id: v.id,
            label: v.label.trim(),
            price: Number(v.price) || 0,
            stockLimit:
              v.stockLimit === null || v.stockLimit === undefined || (v.stockLimit as unknown) === ""
                ? null
                : Number(v.stockLimit),
            sortOrder: i,
            recipe: Array.isArray(v.recipe)
              ? v.recipe
                  .filter((r) => r.ingredientId)
                  .map((r) => ({ ingredientId: Number(r.ingredientId), amount: Number(r.amount) || 0 }))
              : [],
          }))
      : [],
  };
}

export function friendlyProductError(err: unknown): string {
  const msg = (err as Error).message || "Save failed";
  if (msg.includes("products_slug_key") || msg.includes("duplicate key")) return "That slug is already in use.";
  return msg;
}
