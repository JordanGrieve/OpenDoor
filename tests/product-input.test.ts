import { describe, it, expect } from "vitest";
import { normalizeProductInput, friendlyProductError } from "@/lib/product-input";

describe("normalizeProductInput", () => {
  it("slugifies a messy slug", () => {
    const out = normalizeProductInput({ name: "Lemon Drizzle Loaf", slug: "  Lemon Drizzle Loaf!! " });
    expect(out.slug).toBe("lemon-drizzle-loaf");
  });

  it("trims leading/trailing separators from the slug", () => {
    expect(normalizeProductInput({ slug: "---cookie---" }).slug).toBe("cookie");
  });

  it("defaults a blank category to Other", () => {
    expect(normalizeProductInput({}).category).toBe("Other");
    expect(normalizeProductInput({ category: "   " }).category).toBe("Other");
  });

  it("coerces prices and never returns NaN", () => {
    expect(normalizeProductInput({ price: "4.50" as unknown as number }).price).toBe(4.5);
    expect(normalizeProductInput({ price: undefined }).price).toBe(0);
    expect(normalizeProductInput({ price: "abc" as unknown as number }).price).toBe(0);
  });

  it("clamps negative lead times to zero", () => {
    expect(normalizeProductInput({ leadTimeDays: -3 }).leadTimeDays).toBe(0);
  });

  it("turns blank meta fields into null rather than empty strings", () => {
    const out = normalizeProductInput({ metaTitle: "   ", metaDescription: "" });
    expect(out.metaTitle).toBeNull();
    expect(out.metaDescription).toBeNull();
  });

  it("turns blank accordion copy into null so the PDP falls back to defaults", () => {
    const out = normalizeProductInput({ deliveryInfo: "  ", storageInfo: "" });
    expect(out.deliveryInfo).toBeNull();
    expect(out.storageInfo).toBeNull();
  });

  it("keeps custom accordion copy when provided", () => {
    const out = normalizeProductInput({ deliveryInfo: " Collect from the blue door. " });
    expect(out.deliveryInfo).toBe("Collect from the blue door.");
  });

  it("drops variants with no label and re-indexes sortOrder", () => {
    const out = normalizeProductInput({
      variants: [
        { label: "Standard", price: 2.5, stockLimit: null },
        { label: "   ", price: 9, stockLimit: null },
        { label: "Box of 6", price: 13.5, stockLimit: 30 },
      ],
    });
    expect(out.variants.map((v) => v.label)).toEqual(["Standard", "Box of 6"]);
    expect(out.variants.map((v) => v.sortOrder)).toEqual([0, 1]);
  });

  it("treats an empty-string stock limit as unlimited (null)", () => {
    const out = normalizeProductInput({
      variants: [{ label: "Standard", price: 2.5, stockLimit: "" as unknown as null }],
    });
    expect(out.variants[0].stockLimit).toBeNull();
  });

  it("defaults missing collections to empty arrays", () => {
    const out = normalizeProductInput({});
    expect(out.allergenIds).toEqual([]);
    expect(out.variants).toEqual([]);
  });
});

describe("friendlyProductError", () => {
  it("explains a duplicate slug in plain language", () => {
    const msg = friendlyProductError(new Error('duplicate key value violates unique constraint "products_slug_key"'));
    expect(msg).toBe("That slug is already in use.");
  });

  it("passes other messages through", () => {
    expect(friendlyProductError(new Error("boom"))).toBe("boom");
  });
});
