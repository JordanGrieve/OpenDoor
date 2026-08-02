import { describe, it, expect } from "vitest";
import { toE164, isDiallable } from "@/lib/phone";

describe("toE164", () => {
  // The case that would otherwise break every customer SMS.
  it("converts a UK mobile typed the normal way", () => {
    expect(toE164("07700 900123")).toBe("+447700900123");
    expect(toE164("07700900123")).toBe("+447700900123");
  });

  it("handles a UK landline", () => {
    expect(toE164("01698 123456")).toBe("+441698123456");
  });

  it("leaves an already-international number alone", () => {
    expect(toE164("+447700900123")).toBe("+447700900123");
    expect(toE164("+44 7700 900123")).toBe("+447700900123");
  });

  it("keeps non-UK international numbers as given", () => {
    expect(toE164("+33 1 23 45 67 89")).toBe("+33123456789");
  });

  it("handles the 00 international prefix", () => {
    expect(toE164("0044 7700 900123")).toBe("+447700900123");
  });

  it("handles a bare country-code number", () => {
    expect(toE164("447700900123")).toBe("+447700900123");
  });

  it("strips brackets, dashes and dots", () => {
    expect(toE164("(07700) 900-123")).toBe("+447700900123");
    expect(toE164("07700.900.123")).toBe("+447700900123");
  });

  it("rejects empty and junk input instead of producing a bad number", () => {
    expect(toE164("")).toBeNull();
    expect(toE164(null)).toBeNull();
    expect(toE164(undefined)).toBeNull();
    expect(toE164("not a phone")).toBeNull();
  });

  it("rejects numbers that are too short or absurdly long", () => {
    expect(toE164("12345")).toBeNull();
    expect(toE164("+4477009001231234567890")).toBeNull();
  });

  it("accepts a different default dialling code when asked", () => {
    expect(toE164("0912345678", "353")).toBe("+353912345678");
  });
});

describe("isDiallable", () => {
  it("accepts real numbers", () => {
    expect(isDiallable("07700 900123")).toBe(true);
  });
  it("rejects junk", () => {
    expect(isDiallable("hello")).toBe(false);
    expect(isDiallable("")).toBe(false);
  });
});
