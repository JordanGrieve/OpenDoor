import { redirect } from "next/navigation";

// Customer accounts are disabled (Clerk is owner-only). Order history +
// cancellation is available to guests via the order lookup page.
export default function AccountPage() {
  redirect("/orders");
}
