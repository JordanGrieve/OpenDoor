import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default async function DeniedPage() {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "your account";

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)", padding: 24 }}>
      <div className="card" style={{ maxWidth: 440, padding: 40, textAlign: "center" }}>
        <div style={{ font: "500 22px 'Playfair Display',serif", color: "var(--ink)" }}>Open Door</div>
        <h1 style={{ font: "500 24px 'Playfair Display',serif", color: "var(--ink)", margin: "18px 0 0" }}>Not authorised</h1>
        <p style={{ font: "400 15px/1.7 Mulish", color: "#6c5a4a", margin: "10px 0 0" }}>
          You&apos;re signed in as <b>{email}</b>, which isn&apos;t permitted to access the owner dashboard.
        </p>
        <div style={{ marginTop: 22 }}>
          <SignOutButton redirectUrl="/">
            <button className="btn btn-primary" style={{ padding: "12px 24px", fontSize: 14, borderRadius: 12 }}>
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
