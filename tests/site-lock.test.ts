import { describe, it, expect } from "vitest";
import { isLockExempt, safeReturnPath } from "@/lib/site-lock";

describe("isLockExempt", () => {
  it("lets the lock screen and its password check through", () => {
    expect(isLockExempt("/lock")).toBe(true);
    expect(isLockExempt("/api/lock")).toBe(true);
  });

  it("lets the newsletter signup through, since the lock screen uses it", () => {
    expect(isLockExempt("/api/contact")).toBe(true);
  });

  it("keeps the Stripe webhook reachable", () => {
    expect(isLockExempt("/api/webhooks/stripe")).toBe(true);
  });

  it("allows framework assets and crawler files", () => {
    expect(isLockExempt("/_next/static/chunk.js")).toBe(true);
    expect(isLockExempt("/robots.txt")).toBe(true);
    expect(isLockExempt("/sitemap.xml")).toBe(true);
  });

  it("allows the favicon and app icons through, so the tab mark still renders", () => {
    expect(isLockExempt("/favicon.ico")).toBe(true);
    expect(isLockExempt("/icon.svg")).toBe(true);
    expect(isLockExempt("/apple-icon.png")).toBe(true);
  });

  it("locks the storefront", () => {
    expect(isLockExempt("/")).toBe(false);
    expect(isLockExempt("/shop")).toBe(false);
    expect(isLockExempt("/checkout")).toBe(false);
    expect(isLockExempt("/product/lemon-drizzle-loaf")).toBe(false);
  });

  it("locks other API routes", () => {
    expect(isLockExempt("/api/products")).toBe(false);
    expect(isLockExempt("/api/checkout/session")).toBe(false);
  });

  it("does not exempt paths that merely start with an exempt string", () => {
    expect(isLockExempt("/lockdown")).toBe(false);
    expect(isLockExempt("/api/contacts")).toBe(false);
  });
});

describe("safeReturnPath", () => {
  it("returns the requested path when it is a normal same-site path", () => {
    expect(safeReturnPath("/shop")).toBe("/shop");
    expect(safeReturnPath("/product/almond-croissant")).toBe("/product/almond-croissant");
  });

  it("falls back home when nothing was requested", () => {
    expect(safeReturnPath(null)).toBe("/");
    expect(safeReturnPath(undefined)).toBe("/");
    expect(safeReturnPath("")).toBe("/");
  });

  it("refuses to bounce the visitor off-site", () => {
    expect(safeReturnPath("//evil.example.com")).toBe("/");
    expect(safeReturnPath("https://evil.example.com")).toBe("/");
    expect(safeReturnPath("evil.example.com")).toBe("/");
  });

  it("never sends them straight back to the lock screen", () => {
    expect(safeReturnPath("/lock")).toBe("/");
  });
});
