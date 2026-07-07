// ─────────────────────────────────────────────────────────────
// Neon serverless Postgres client.
//   import { sql } from "@/lib/db";
//   const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
// Works on Vercel serverless/edge. Throws a clear error if the
// connection string is missing rather than a cryptic driver error.
// ─────────────────────────────────────────────────────────────
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string."
    );
  }
  _sql = neon(url);
  return _sql;
}

/**
 * Tagged-template query. Proxied so `import { sql }` works at module
 * load without eagerly requiring DATABASE_URL (it resolves on first call).
 */
export const sql: NeonQueryFunction<false, false> = new Proxy(
  (() => {}) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_target, _thisArg, argArray) {
      // @ts-expect-error — forwarding tagged-template args
      return getSql()(...argArray);
    },
    get(_target, prop) {
      // forward helpers like sql.query / sql.transaction
      const s = getSql() as unknown as Record<string | symbol, unknown>;
      return s[prop];
    },
  }
);

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
