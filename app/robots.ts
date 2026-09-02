import type { MetadataRoute } from "next";
import { SITE_LOCKED } from "@/lib/config";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  // While the site is locked every public page redirects to /lock, so
  // inviting crawlers in would only get the holding page indexed.
  if (SITE_LOCKED) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api", "/checkout", "/account", "/orders"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
