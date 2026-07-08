"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const from = params.get("from");
      router.push(from && from.startsWith("/dashboard") ? from : "/dashboard");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Incorrect password.");
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)", padding: 24 }}>
      <form onSubmit={submit} className="card" style={{ width: "100%", maxWidth: 380, padding: 36 }}>
        <div style={{ font: "500 22px 'Playfair Display',serif", color: "var(--ink)" }}>Open Door</div>
        <div style={{ font: "600 10px Mulish", letterSpacing: ".22em", textTransform: "uppercase", color: "var(--muted)", marginTop: 2 }}>
          Owner dashboard
        </div>
        <label className="field-label" style={{ marginTop: 24 }}>Password</label>
        <input
          type="password"
          className="field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="••••••••"
        />
        {error && <div className="field-error" style={{ marginTop: 8 }}>{error}</div>}
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: 18, padding: 14, fontSize: 15, borderRadius: 14 }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default function LoginForm() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
