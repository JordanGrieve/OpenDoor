// Customer reviews data access.
import { sql } from "@/lib/db";
import { num } from "@/lib/money";

type Row = Record<string, unknown>;

export interface Review {
  id: number;
  name: string;
  email: string | null;
  rating: number;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  publishedAt: string | null;
}

function map(r: Row): Review {
  return {
    id: Number(r.id),
    name: String(r.name),
    email: (r.email as string) ?? null,
    rating: Number(r.rating),
    body: String(r.body),
    status: r.status as Review["status"],
    createdAt: String(r.created_at),
    publishedAt: r.published_at ? String(r.published_at) : null,
  };
}

export async function createReview(input: { name: string; email?: string | null; rating: number; body: string }) {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating || 5)));
  const rows = (await sql`
    INSERT INTO reviews (name, email, rating, body)
    VALUES (${input.name.trim()}, ${input.email?.trim() || null}, ${rating}, ${input.body.trim()})
    RETURNING id
  `) as Row[];
  return Number(rows[0].id);
}

/** Approved reviews for public display. */
export async function listApprovedReviews(limit = 12): Promise<Review[]> {
  const rows = (await sql`
    SELECT * FROM reviews WHERE status = 'approved'
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT ${limit}
  `) as Row[];
  return rows.map(map);
}

/** Count + average of approved reviews (for AggregateRating). */
export async function getReviewAggregate(): Promise<{ count: number; average: number }> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::numeric(3,2) AS average
    FROM reviews WHERE status = 'approved'
  `) as Row[];
  return { count: Number(rows[0].count), average: num(rows[0].average) };
}

/** All reviews for the dashboard moderation queue. */
export async function listAllReviews(): Promise<Review[]> {
  const rows = (await sql`SELECT * FROM reviews ORDER BY created_at DESC`) as Row[];
  return rows.map(map);
}

export async function setReviewStatus(id: number, status: "approved" | "rejected" | "pending") {
  if (status === "approved") {
    await sql`UPDATE reviews SET status = 'approved', published_at = now() WHERE id = ${id}`;
  } else {
    await sql`UPDATE reviews SET status = ${status}, published_at = NULL WHERE id = ${id}`;
  }
}
