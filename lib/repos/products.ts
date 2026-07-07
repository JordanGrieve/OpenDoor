// ─────────────────────────────────────────────────────────────
// Product data access — maps DB rows to the shared Product types.
// One place so storefront + dashboard read products identically.
// ─────────────────────────────────────────────────────────────
import { sql } from "@/lib/db";
import { num } from "@/lib/money";
import type {
  Allergen,
  Product,
  ProductImage,
  ProductSummary,
  ProductVariant,
} from "@/lib/types";

type Row = Record<string, unknown>;

function mapAllergens(raw: unknown): Allergen[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((a: Row) => ({
    id: Number(a.id),
    slug: String(a.slug),
    name: String(a.name),
  }));
}

function mapVariants(raw: unknown, productId: number): ProductVariant[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((v: Row) => ({
      id: Number(v.id),
      productId,
      label: String(v.label),
      price: num(v.price),
      stockLimit: v.stock_limit === null || v.stock_limit === undefined ? null : Number(v.stock_limit),
      sortOrder: Number(v.sort_order ?? 0),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function mapImages(raw: unknown, productId: number): ProductImage[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((i: Row) => ({
      id: Number(i.id),
      productId,
      cloudflareId: (i.cloudflare_id as string) ?? null,
      url: String(i.url),
      alt: String(i.alt ?? ""),
      position: Number(i.position ?? 0),
    }))
    .sort((a, b) => a.position - b.position);
}

/** Storefront catalogue — active products with first image + allergens. */
export async function getProductSummaries(): Promise<ProductSummary[]> {
  const rows = (await sql`
    SELECT
      p.id, p.slug, p.name, p.description, p.category, p.price,
      p.lead_time_days, p.celebration,
      (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY position LIMIT 1) AS image_url,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object('id', a.id, 'slug', a.slug, 'name', a.name))
          FILTER (WHERE a.id IS NOT NULL), '[]'
      ) AS allergens,
      EXISTS(
        SELECT 1 FROM product_variants v
        WHERE v.product_id = p.id AND v.label <> 'Standard'
      ) AS has_variants
    FROM products p
    LEFT JOIN product_allergens pa ON pa.product_id = p.id
    LEFT JOIN allergens a ON a.id = pa.allergen_id
    WHERE p.archived = FALSE
    GROUP BY p.id
    ORDER BY p.category, p.name
  `) as Row[];

  return rows.map((r) => ({
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description ?? ""),
    category: String(r.category),
    price: num(r.price),
    leadTimeDays: Number(r.lead_time_days),
    celebration: Boolean(r.celebration),
    imageUrl: (r.image_url as string) ?? null,
    allergens: mapAllergens(r.allergens),
    hasVariants: Boolean(r.has_variants),
  }));
}

/** Full product by slug (detail page + dashboard editor). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = (await sql`
    SELECT
      p.*,
      COALESCE((SELECT json_agg(v ORDER BY v.sort_order)
                FROM product_variants v WHERE v.product_id = p.id), '[]') AS variants,
      COALESCE((SELECT json_agg(i ORDER BY i.position)
                FROM product_images i WHERE i.product_id = p.id), '[]') AS images,
      COALESCE((SELECT json_agg(jsonb_build_object('id', a.id, 'slug', a.slug, 'name', a.name))
                FROM product_allergens pa JOIN allergens a ON a.id = pa.allergen_id
                WHERE pa.product_id = p.id), '[]') AS allergens
    FROM products p
    WHERE p.slug = ${slug}
    LIMIT 1
  `) as Row[];

  const r = rows[0];
  if (!r) return null;
  return mapProduct(r);
}

/** Full product by id (dashboard). */
export async function getProductById(id: number): Promise<Product | null> {
  const rows = (await sql`
    SELECT
      p.*,
      COALESCE((SELECT json_agg(v ORDER BY v.sort_order)
                FROM product_variants v WHERE v.product_id = p.id), '[]') AS variants,
      COALESCE((SELECT json_agg(i ORDER BY i.position)
                FROM product_images i WHERE i.product_id = p.id), '[]') AS images,
      COALESCE((SELECT json_agg(jsonb_build_object('id', a.id, 'slug', a.slug, 'name', a.name))
                FROM product_allergens pa JOIN allergens a ON a.id = pa.allergen_id
                WHERE pa.product_id = p.id), '[]') AS allergens
    FROM products p
    WHERE p.id = ${id}
    LIMIT 1
  `) as Row[];
  const r = rows[0];
  if (!r) return null;
  return mapProduct(r);
}

function mapProduct(r: Row): Product {
  const id = Number(r.id);
  return {
    id,
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description ?? ""),
    category: String(r.category),
    price: num(r.price),
    leadTimeDays: Number(r.lead_time_days),
    celebration: Boolean(r.celebration),
    metaTitle: (r.meta_title as string) ?? null,
    metaDescription: (r.meta_description as string) ?? null,
    archived: Boolean(r.archived),
    variants: mapVariants(r.variants, id),
    images: mapImages(r.images, id),
    allergens: mapAllergens(r.allergens),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function getAllergens(): Promise<Allergen[]> {
  const rows = (await sql`SELECT id, slug, name FROM allergens ORDER BY name`) as Row[];
  return mapAllergens(rows);
}
