import { Suspense } from "react";
import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop",
  description: "Freshly baked pastries, cakes, brownies, tarts, cookies and celebration boxes. Filter by category and allergen.",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <ShopClient />
    </Suspense>
  );
}
