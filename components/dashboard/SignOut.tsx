"use client";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";

const btnStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  font: "600 13px Mulish",
  color: "#c9b8a3",
  background: "none",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  width: "100%",
};

function PasswordSignOut() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/dashboard/login");
    router.refresh();
  };
  return (
    <button onClick={logout} style={btnStyle}>
      Sign out
    </button>
  );
}

function ClerkSignOut() {
  return (
    <SignOutButton redirectUrl="/">
      <button style={btnStyle}>Sign out</button>
    </SignOutButton>
  );
}

export default function SignOut() {
  return clerkEnabled ? <ClerkSignOut /> : <PasswordSignOut />;
}
