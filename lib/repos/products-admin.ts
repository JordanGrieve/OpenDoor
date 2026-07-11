// ─────────────────────────────────────────────────────────────
// Admin product writes — create/update (with nested variants +
// recipes + allergens), images, availability, archive.
// ─────────────────────────────────────────────────────────────
import { sql } from "@/lib/db";
import { num } from "@/lib/money";
import { isoDate } from "@/lib/dates";
import { getProductById } from "@/lib/repos/products";
import type { Ingredient, Product } from "@/lib/types";

type Row = Record<string, unknown>;

export interface VariantInput {
  id?: number;
  label: string;
  price: number;
  stockLimit: number | null;
  sortOrder?: number;
  recipe?: { ingredientId: number; amount: number }[];
}

export interface ProductInput {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  leadTimeDays: number;
  celebration: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  deliveryInfo: string | null;
  storageInfo: string | null;
  allergenIds: number[];
  variants: VariantInput[];
}

/** Product list for the dashboard (includes archived). */
export async function listAllProducts(): Promise<
  (Pick<Product, "id" | "slug" | "name" | "category" | "price" | "leadTimeDays" | "archived"> & {
    variantCount: number;
    imageUrl: string | null;
  })[]
> {
  const rows = (await sql`
    SELECT p.id, p.slug, p.name, p.category, p.price, p.lead_time_days, p.archived,
      (SELECT count(*) FROM product_variants v WHERE v.product_id = p.id) AS variant_count,
      (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY position LIMIT 1) AS image_url
    FROM products p
    ORDER BY p.archived, p.category, p.name
  `) as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name),
    category: String(r.category),
    price: num(r.price),
    leadTimeDays: Number(r.lead_time_days),
    archived: Boolean(r.archived),
    variantCount: Number(r.variant_count),
    imageUrl: (r.image_url as string) ?? null,
  }));
}

export async function createProduct(input: ProductInput): Promise<Product | null> {
  const rows = (await sql`
    INSERT INTO products (slug, name, description, category, price, lead_time_days, celebration, meta_title, meta_description, delivery_info, storage_info)
    VALUES (${input.slug}, ${input.name}, ${input.description}, ${input.category}, ${input.price},
            ${input.leadTimeDays}, ${input.celebration}, ${input.metaTitle}, ${input.metaDescription}, ${input.deliveryInfo}, ${input.storageInfo})
    RETURNING id
  `) as Row[];
  const id = Number(rows[0].id);
  await setAllergens(id, input.allergenIds);
  await upsertVariants(id, input.variants);
  return getProductById(id);
}

export async function updateProduct(id: number, input: ProductInput): Promise<Product | null> {
  await sql`
    UPDATE products SET
      slug = ${input.slug}, name = ${input.name}, description = ${input.description},
      category = ${input.category}, price = ${input.price}, lead_time_days = ${input.leadTimeDays},
      celebration = ${input.celebration}, meta_title = ${input.metaTitle},
      meta_description = ${input.metaDescription}, delivery_info = ${input.deliveryInfo},
      storage_info = ${input.storageInfo}, updated_at = now()
    WHERE id = ${id}
  `;
  await setAllergens(id, input.allergenIds);
  await upsertVariants(id, input.variants);
  return getProductById(id);
}

export async function setAllergens(productId: number, allergenIds: number[]) {
  await sql`DELETE FROM product_allergens WHERE product_id = ${productId}`;
  for (const aid of allergenIds) {
    await sql`INSERT INTO product_allergens (product_id, allergen_id) VALUES (${productId}, ${aid}) ON CONFLICT DO NOTHING`;
  }
}

/** Upsert variants (update by id, insert new, delete removed) and their recipes. */
export async function upsertVariants(productId: number, variants: VariantInput[]) {
  const existing = (await sql`SELECT id FROM product_variants WHERE product_id = ${productId}`) as Row[];
  const existingIds = new Set(existing.map((r) => Number(r.id)));
  const keepIds = new Set<number>();

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const sortOrder = v.sortOrder ?? i;
    let variantId: number;
    if (v.id && existingIds.has(v.id)) {
      await sql`
        UPDATE product_variants SET label = ${v.label}, price = ${v.price},
          stock_limit = ${v.stockLimit}, sort_order = ${sortOrder}
        WHERE id = ${v.id} AND product_id = ${productId}
      `;
      variantId = v.id;
    } else {
      const rows = (await sql`
        INSERT INTO product_variants (product_id, label, price, stock_limit, sort_order)
        VALUES (${productId}, ${v.label}, ${v.price}, ${v.stockLimit}, ${sortOrder})
        RETURNING id
      `) as Row[];
      variantId = Number(rows[0].id);
    }
    keepIds.add(variantId);

    // replace recipe for this variant
    await sql`DELETE FROM recipe_items WHERE variant_id = ${variantId}`;
    for (const ri of v.recipe ?? []) {
      if (!ri.ingredientId || ri.amount == null) continue;
      await sql`
        INSERT INTO recipe_items (variant_id, ingredient_id, amount)
        VALUES (${variantId}, ${ri.ingredientId}, ${ri.amount})
        ON CONFLICT (variant_id, ingredient_id) DO UPDATE SET amount = ${ri.amount}
      `;
    }
  }

  // delete variants the editor removed
  for (const oldId of existingIds) {
    if (!keepIds.has(oldId)) await sql`DELETE FROM product_variants WHERE id = ${oldId}`;
  }
}

export async function archiveProduct(id: number, archived: boolean) {
  await sql`UPDATE products SET archived = ${archived}, updated_at = now() WHERE id = ${id}`;
}

// ── Images ─────────────────────────────────────────────────────
export async function addProductImage(
  productId: number,
  data: { url: string; cloudflareId?: string | null; alt?: string }
) {
  const posRows = (await sql`
    SELECT COALESCE(MAX(position), -1) + 1 AS next FROM product_images WHERE product_id = ${productId}
  `) as Row[];
  const position = Number(posRows[0].next);
  const rows = (await sql`
    INSERT INTO product_images (product_id, cloudflare_id, url, alt, position)
    VALUES (${productId}, ${data.cloudflareId ?? null}, ${data.url}, ${data.alt ?? ""}, ${position})
    RETURNING id
  `) as Row[];
  return Number(rows[0].id);
}

export async function removeProductImage(imageId: number) {
  await sql`DELETE FROM product_images WHERE id = ${imageId}`;
}

// ── Daily availability ─────────────────────────────────────────
export async function setAvailability(productId: number, day: string, available: boolean) {
  await sql`
    INSERT INTO product_availability (product_id, day, available, stock_sold)
    VALUES (${productId}, ${day}, ${available}, 0)
    ON CONFLICT (product_id, day) DO UPDATE SET available = ${available}
  `;
}

export async function getAvailability(productId: number, fromDay: string, days = 10) {
  const end = new Date(fromDay + "T00:00:00");
  end.setDate(end.getDate() + days);
  const toDay = isoDate(end);
  const rows = (await sql`
    SELECT day, available, stock_sold
    FROM product_availability
    WHERE product_id = ${productId} AND day >= ${fromDay} AND day <= ${toDay}
    ORDER BY day
  `) as Row[];
  return rows.map((r) => ({
    day: String(r.day).slice(0, 10),
    available: Boolean(r.available),
    stockSold: Number(r.stock_sold),
  }));
}

// ── Ingredients (shared with stock section) ────────────────────
export async function listIngredients(): Promise<Ingredient[]> {
  const rows = (await sql`SELECT * FROM ingredients ORDER BY category, name`) as Row[];
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    unit: String(r.unit),
    category: String(r.category),
    stock: num(r.stock),
  }));
}

/** Recipe rows for a product's variants (for the editor). */
export async function getProductRecipes(productId: number): Promise<Record<number, { ingredientId: number; amount: number }[]>> {
  const rows = (await sql`
    SELECT ri.variant_id, ri.ingredient_id, ri.amount
    FROM recipe_items ri
    JOIN product_variants v ON v.id = ri.variant_id
    WHERE v.product_id = ${productId}
  `) as Row[];
  const out: Record<number, { ingredientId: number; amount: number }[]> = {};
  for (const r of rows) {
    const vid = Number(r.variant_id);
    (out[vid] ??= []).push({ ingredientId: Number(r.ingredient_id), amount: num(r.amount) });
  }
  return out;
}
