import type { MetadataRoute } from "next";
import { getProductSummaries } from "@/lib/repos/products";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["", "/shop", "/custom", "/gallery", "/contact"].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  let products: MetadataRoute.Sitemap = [];
  try {
    const summaries = await getProductSummaries();
    products = summaries.map((p) => ({
      url: `${SITE}/products/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable at build — ship the static entries only.
  }

  return [...staticPages, ...products];
}
