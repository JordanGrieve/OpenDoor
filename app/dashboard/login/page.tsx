import { redirect } from "next/navigation";
import { clerkEnabled } from "@/lib/clerk";
import LoginForm from "./LoginForm";

// When Clerk is configured the dashboard uses Clerk sign-in, so the
// password login is retired — send anyone here straight to /dashboard
// (the middleware will bounce them to Clerk sign-in if needed).
export default function LoginPage() {
  if (clerkEnabled) redirect("/dashboard");
  return <LoginForm />;
}
