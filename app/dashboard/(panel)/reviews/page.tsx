"use client";
import { useCallback, useEffect, useState } from "react";
import type { Review } from "@/lib/repos/reviews";

const STATUS_COLOR: Record<string, string> = {
  pending: "#9c6f43",
  approved: "#4a6b3a",
  rejected: "#b5482f",
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    const d = await fetch("/api/admin/reviews").then((r) => r.json());
    setReviews(d.reviews ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: number, status: string) => {
    setBusy(id);
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setBusy(null);
  };

  const pending = reviews.filter((r) => r.status === "pending");
  const others = reviews.filter((r) => r.status !== "pending");

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ font: "500 30px 'Playfair Display',serif", color: "var(--ink)", margin: "0 0 6px" }}>Reviews</h1>
      <p style={{ font: "400 14px Mulish", color: "#6c5a4a", marginBottom: 20 }}>
        Approve reviews to publish them on the storefront (with star ratings in Google). {pending.length} awaiting review.
      </p>

      {loading ? (
        <div style={{ color: "var(--muted)", font: "500 15px Mulish" }}>Loading…</div>
      ) : reviews.length === 0 ? (
        <div className="card" style={{ padding: 32, color: "var(--muted)", font: "500 15px Mulish" }}>No reviews yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...pending, ...others].map((r) => (
            <div key={r.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ color: "var(--accent)", fontSize: 14, letterSpacing: 1 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span style={{ font: "600 14px Mulish", color: "var(--ink)" }}>{r.name}</span>
                    <span style={{ font: "600 11px Mulish", color: STATUS_COLOR[r.status], textTransform: "uppercase", letterSpacing: ".04em" }}>{r.status}</span>
                  </div>
                  <p style={{ font: "400 14px/1.6 Mulish", color: "#6c5a4a", margin: "8px 0 0" }}>{r.body}</p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {r.status !== "approved" && (
                    <button onClick={() => setStatus(r.id, "approved")} disabled={busy === r.id} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12.5 }}>Approve</button>
                  )}
                  {r.status !== "rejected" && (
                    <button onClick={() => setStatus(r.id, "rejected")} disabled={busy === r.id} className="btn" style={{ padding: "8px 14px", fontSize: 12.5, background: "none", border: "1.5px solid var(--line)", borderRadius: 999, color: "var(--danger)" }}>Reject</button>
                  )}
                  {r.status === "approved" && (
                    <button onClick={() => setStatus(r.id, "pending")} disabled={busy === r.id} className="btn" style={{ padding: "8px 14px", fontSize: 12.5, background: "none", border: "1.5px solid var(--line)", borderRadius: 999, color: "var(--muted)" }}>Unpublish</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
