import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <CheckoutClient />
    </Suspense>
  );
}
