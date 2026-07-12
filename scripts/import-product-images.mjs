#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Bulk-import product images from a local folder → Cloudinary →
// attach to products in the DB.
//
// Naming convention (filename → product):
//   <slug>.jpg            → main image   (position 0)
//   <slug>-2.jpg          → gallery image (position 1)
//   <slug>-3.png          → gallery image (position 2)   … etc.
//   (jpg / jpeg / png / webp / avif supported)
//
// Usage:
//   node scripts/import-product-images.mjs [--dir ./product-images] [--replace] [--dry-run]
//     --replace   clear a product's existing images before importing its files
//     --dry-run   show what would happen, upload/insert nothing
// ─────────────────────────────────────────────────────────────
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import dotenv from "dotenv";
import pg from "pg";
import { v2 as cloudinary } from "cloudinary";

dotenv.config({ path: ".env.local" });
dotenv.config();

const args = process.argv.slice(2);
const dir = (() => { const i = args.indexOf("--dir"); return i >= 0 ? args[i + 1] : "product-images"; })();
const replace = args.includes("--replace");
const dryRun = args.includes("--dry-run");

if (!process.env.DATABASE_URL) { console.error("✗ DATABASE_URL not set"); process.exit(1); }
if (!process.env.CLOUDINARY_CLOUD_NAME) { console.error("✗ CLOUDINARY_* not set"); process.exit(1); }
if (!existsSync(dir)) { console.error(`✗ Folder "${dir}" not found. Create it and drop images in.`); process.exit(1); }

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

function parse(filename) {
  const base = filename.replace(/\.(jpe?g|png|webp|avif)$/i, "");
  const m = base.match(/^(.+)-(\d+)$/);
  return m ? { slug: m[1], position: parseInt(m[2], 10) - 1 } : { slug: base, position: 0 };
}

async function main() {
  await client.connect();
  const files = readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort();
  if (files.length === 0) { console.log(`No images in "${dir}".`); return; }
  console.log(`Found ${files.length} image(s) in "${dir}"${dryRun ? " (dry run)" : ""}\n`);

  const seenReplace = new Set();
  let ok = 0, skipped = 0;

  for (const file of files) {
    const { slug, position } = parse(file);
    const prod = (await client.query("SELECT id, name FROM products WHERE slug = $1", [slug])).rows[0];
    if (!prod) { console.log(`•  ${file} → no product with slug "${slug}" — skipped`); skipped++; continue; }

    if (replace && !seenReplace.has(prod.id)) {
      if (!dryRun) await client.query("DELETE FROM product_images WHERE product_id = $1", [prod.id]);
      seenReplace.add(prod.id);
      console.log(`   (cleared existing images for ${prod.name})`);
    }

    if (dryRun) { console.log(`•  ${file} → ${prod.name} (pos ${position})`); ok++; continue; }

    try {
      const publicId = position > 0
        ? `open-door/products/${slug}-${position + 1}`
        : `open-door/products/${slug}`;
      const res = await cloudinary.uploader.upload(join(dir, file), { public_id: publicId, overwrite: true });
      const url = cloudinary.url(res.public_id, { fetch_format: "auto", quality: "auto", secure: true });
      await client.query(
        "INSERT INTO product_images (product_id, cloudflare_id, url, alt, position) VALUES ($1,$2,$3,$4,$5)",
        [prod.id, res.public_id, url, prod.name, position]
      );
      console.log(`✓  ${file} → ${prod.name} (pos ${position})`);
      ok++;
    } catch (err) {
      console.log(`✗  ${file} → upload failed: ${err.message}`);
      skipped++;
    }
  }
  console.log(`\nDone: ${ok} imported, ${skipped} skipped.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => client.end());
