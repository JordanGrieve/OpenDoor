import { ClerkProvider } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";

// Clerk is scoped to the dashboard only — the storefront never loads it.
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  if (clerkEnabled) return <ClerkProvider>{children}</ClerkProvider>;
  return <>{children}</>;
}
