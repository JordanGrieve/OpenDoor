// ─────────────────────────────────────────────────────────────
// Database client with two backends behind one `sql` tagged template:
//   • Neon serverless (production / when DATABASE_URL is a real string)
//   • PGlite embedded Postgres (local dev fallback — zero setup, WASM,
//     auto-migrates + seeds itself on first use)
//
//   import { sql } from "@/lib/db";
//   const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
// ─────────────────────────────────────────────────────────────
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Row = Record<string, unknown>;
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;

const RAW_URL = process.env.DATABASE_URL?.trim();
// Use the embedded DB when there's no real connection string (or an explicit opt-in).
const USE_PGLITE = !RAW_URL || RAW_URL === "pglite" || RAW_URL.startsWith("file:");

export function hasDatabase(): boolean {
  return Boolean(RAW_URL) || USE_PGLITE;
}

// ── Neon backend ───────────────────────────────────────────────
let _neon: NeonQueryFunction<false, false> | null = null;
function neonSql(): NeonQueryFunction<false, false> {
  if (!_neon) _neon = neon(RAW_URL as string);
  return _neon;
}

// ── PGlite backend (dev) ───────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pglitePromise: Promise<any> | null = null;

async function getPglite() {
  if (_pglitePromise) return _pglitePromise;
  _pglitePromise = (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const { readFileSync, readdirSync } = await import("node:fs");
    const { join } = await import("node:path");

    const dataDir = process.env.PGLITE_DIR || join(process.cwd(), ".pglite");
    const db = new PGlite(dataDir);
    await db.waitReady;

    // Apply any PENDING migrations, tracked the same way db/migrate.mjs does.
    // Previously this only ran when the products table was missing, so an
    // existing .pglite directory silently kept a stale schema and every
    // migration added afterwards was never applied locally.
    await db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        run_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    const migrationsDir = join(process.cwd(), "db", "migrations");
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
    const done = new Set(
      ((await db.query(`SELECT name FROM _migrations`)).rows as Row[]).map((r) => String(r.name))
    );
    // A pre-existing database created before this tracking was added already
    // has the initial schema, so record it rather than trying to re-run it.
    const hadProducts = Boolean((((await db.query(`SELECT to_regclass('public.products') AS t`)).rows[0]) as Row)?.t);

    for (const f of files) {
      if (done.has(f)) continue;
      if (hadProducts && f === files[0]) {
        await db.query(`INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`, [f]);
        continue;
      }
      try {
        await db.exec(readFileSync(join(migrationsDir, f), "utf8"));
        await db.query(`INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`, [f]);
        console.log(`[db:pglite] applied ${f}`);
      } catch (err) {
        // An older .pglite may already contain some of a later migration's
        // objects; IF NOT EXISTS guards cover most of it, so record and move on.
        console.warn(`[db:pglite] ${f} skipped: ${(err as Error).message}`);
        await db.query(`INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`, [f]);
      }
    }
    const count = await db.query(`SELECT count(*)::int AS n FROM products`);
    if (((count.rows[0] as Row)?.n ?? 0) === 0) {
      await db.exec(readFileSync(join(process.cwd(), "db", "seed.sql"), "utf8"));
      console.log("[db:pglite] seed loaded");
    }
    return db;
  })();
  return _pglitePromise;
}

/** Normalise PGlite values so mappers see the same shapes as Neon (ISO strings for dates). */
function normalizeRows(rows: Row[]): Row[] {
  for (const row of rows) {
    for (const k in row) {
      const v = row[k];
      if (v instanceof Date) row[k] = v.toISOString();
    }
  }
  return rows;
}

async function pgliteQuery(strings: TemplateStringsArray, values: unknown[]): Promise<Row[]> {
  let text = "";
  strings.forEach((s, i) => {
    text += s;
    if (i < values.length) text += `$${i + 1}`;
  });
  const db = await getPglite();
  const res = await db.query(text, values);
  return normalizeRows(res.rows as Row[]);
}

// ── Unified tagged template ────────────────────────────────────
export const sql: SqlTag = (strings, ...values) => {
  if (USE_PGLITE) return pgliteQuery(strings, values);
  // Neon's tagged template returns the rows array directly.
  return (neonSql() as unknown as SqlTag)(strings, ...values);
};
