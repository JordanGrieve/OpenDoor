#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Open Door Bakery — migration + seed runner
//   node db/migrate.mjs           run pending migrations
//   node db/migrate.mjs --seed    run migrations, then seed
//   node db/migrate.mjs --reset   drop public schema, then migrate
//   node db/migrate.mjs --reset --seed
// ─────────────────────────────────────────────────────────────
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import pg from "pg";

// Load .env.local first (Next.js convention), then .env as fallback.
dotenv.config({ path: ".env.local" });
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const doReset = args.includes("--reset");
const doSeed = args.includes("--seed");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("✗ DATABASE_URL is not set. Add it to .env.local (see .env.example).");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("→ Connected to Postgres");

  if (doReset) {
    console.log("⚠  Resetting: DROP SCHEMA public CASCADE");
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      run_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const { rowCount } = await client.query("SELECT 1 FROM _migrations WHERE name = $1", [file]);
    if (rowCount > 0) {
      console.log(`•  ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`→  applying ${file}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`✓  ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }

  if (doSeed) {
    const seedSql = readFileSync(join(__dirname, "seed.sql"), "utf8");
    console.log("→  seeding");
    await client.query(seedSql);
    console.log("✓  seed complete");
  }

  console.log("✓ Done");
}

main()
  .catch((err) => {
    console.error("✗ Migration failed:\n", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
