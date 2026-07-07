"use client";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

// Rendered only when Clerk is configured (see Header). Guest checkout stays
// the default; this just adds optional accounts + order history.
export default function AccountNav() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
      <SignedIn>
        <Link href="/account" style={{ font: "600 14px Mulish", color: "var(--ink)" }}>
          My orders
        </Link>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="btn" style={{ background: "none", border: "none", font: "600 14px Mulish", color: "var(--ink)", cursor: "pointer" }}>
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
    </div>
  );
}
