import { describe, it, expect } from "vitest";
import { bakeryJsonLd, productJsonLd, BUSINESS } from "@/lib/seo";
import { SELLING_ENABLED } from "@/lib/config";
import type { Product } from "@/lib/types";

const product = {
  id: 1,
  slug: "triple-chocolate-brownie",
  name: "Triple Chocolate Brownie",
  description: "Deeply gooey triple chocolate brownies.",
  category: "Brownies",
  price: 2.8,
  leadTimeDays: 2,
  celebration: false,
  metaTitle: "Triple Chocolate Brownie",
  metaDescription: "Deeply gooey triple chocolate brownies, baked in Hamilton.",
  deliveryInfo: null,
  storageInfo: null,
  archived: false,
  variants: [],
  images: [{ id: 1, productId: 1, url: "https://res.cloudinary.com/x/image/upload/brownie", alt: "", position: 0 }],
  allergens: [],
  createdAt: "2026-07-08",
  updatedAt: "2026-07-08",
} as unknown as Product;

describe("bakeryJsonLd", () => {
  const ld = bakeryJsonLd();

  it("is a Bakery LocalBusiness", () => {
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Bakery");
  });

  it("carries the Hamilton address and postcode Google needs", () => {
    expect(ld.address.addressLocality).toBe("Hamilton");
    expect(ld.address.postalCode).toBe("ML3 7PD");
    expect(ld.address.addressCountry).toBe("GB");
  });

  it("has geo coordinates inside Scotland's bounding box", () => {
    expect(ld.geo.latitude).toBeGreaterThan(54.6);
    expect(ld.geo.latitude).toBeLessThan(58.7);
    expect(ld.geo.longitude).toBeGreaterThan(-7.6);
    expect(ld.geo.longitude).toBeLessThan(-1.0);
  });

  it("lists the served towns as City entries", () => {
    expect(ld.areaServed.length).toBe(BUSINESS.areaServed.length);
    expect(ld.areaServed.every((a) => a["@type"] === "City")).toBe(true);
    expect(ld.areaServed.map((a) => a.name)).toContain("Hamilton");
  });

  it("never advertises Monday opening (kitchen closed)", () => {
    const days = ld.openingHoursSpecification.flatMap((s) => s.dayOfWeek);
    expect(days).not.toContain("Monday");
  });
});

describe("productJsonLd", () => {
  const ld = productJsonLd(product);

  it("is a Product with the brand attached", () => {
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("Triple Chocolate Brownie");
    expect(ld.brand.name).toBe("Open Door Bakery");
  });

  it("prefers the meta description for the snippet", () => {
    expect(ld.description).toBe(product.metaDescription);
  });

  it("prices in GBP with two decimals", () => {
    expect(ld.offers.priceCurrency).toBe("GBP");
    expect(ld.offers.price).toBe("2.80");
  });

  it("points the offer at the canonical product URL", () => {
    expect(ld.offers.url).toMatch(/\/products\/triple-chocolate-brownie$/);
  });

  it("includes the first image when one exists", () => {
    expect(ld.image).toBe(product.images[0].url);
  });

  it("omits image entirely when the product has none", () => {
    const noImage = productJsonLd({ ...product, images: [] } as unknown as Product);
    expect("image" in noImage).toBe(false);
  });

  // Availability must never claim InStock while the shop cannot take orders.
  it("reports availability consistent with the selling switch", () => {
    const expected = SELLING_ENABLED
      ? "https://schema.org/InStock"
      : "https://schema.org/PreOrder";
    expect(ld.offers.availability).toBe(expected);
  });
});
