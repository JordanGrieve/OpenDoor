import { describe, it, expect } from "vitest";
import { postcodeDistrict, isPostcodeInDistricts } from "@/lib/repos/store";

// The live delivery districts (~8 miles of the Hamilton kitchen).
const DISTRICTS = ["ML1", "ML2", "ML3", "ML4", "ML5", "ML6", "ML8", "ML9", "G71", "G72", "G73", "G74", "G75"];

describe("postcodeDistrict", () => {
  it("strips the 3-char inward code", () => {
    expect(postcodeDistrict("ML3 7PD")).toBe("ML3");
    expect(postcodeDistrict("G72 8QW")).toBe("G72");
  });

  it("is whitespace and case insensitive", () => {
    expect(postcodeDistrict("ml3 7pd")).toBe("ML3");
    expect(postcodeDistrict("ML37PD")).toBe("ML3");
    expect(postcodeDistrict("  ml3   7pd  ")).toBe("ML3");
  });

  it("handles 4-char districts", () => {
    expect(postcodeDistrict("ML10 6AB")).toBe("ML10");
    expect(postcodeDistrict("EH12 9XY")).toBe("EH12");
  });

  it("rejects partial postcodes", () => {
    expect(postcodeDistrict("ML3")).toBeNull();
    expect(postcodeDistrict("")).toBeNull();
    expect(postcodeDistrict("ML")).toBeNull();
  });

  it("does not throw on null-ish input", () => {
    expect(postcodeDistrict(null as unknown as string)).toBeNull();
    expect(postcodeDistrict(undefined as unknown as string)).toBeNull();
  });
});

describe("isPostcodeInDistricts", () => {
  it("accepts postcodes inside the delivery area", () => {
    expect(isPostcodeInDistricts("ML3 7PD", DISTRICTS)).toBe(true);
    expect(isPostcodeInDistricts("ml1 1aa", DISTRICTS)).toBe(true);
    expect(isPostcodeInDistricts("G74 3XY", DISTRICTS)).toBe(true);
  });

  it("rejects postcodes outside the delivery area", () => {
    expect(isPostcodeInDistricts("EH1 1AA", DISTRICTS)).toBe(false);
    expect(isPostcodeInDistricts("SW1A 1AA", DISTRICTS)).toBe(false);
  });

  // The regression this matching style exists to prevent: a naive
  // "startsWith" check would treat ML10/ML11 as inside ML1.
  it("does not let ML10/ML11 match the ML1 district", () => {
    expect(isPostcodeInDistricts("ML10 6AB", DISTRICTS)).toBe(false);
    expect(isPostcodeInDistricts("ML11 9ZZ", DISTRICTS)).toBe(false);
  });

  it("does not let G750 style codes match G75", () => {
    expect(isPostcodeInDistricts("G750 1AA", DISTRICTS)).toBe(false);
  });

  it("rejects partial postcodes even when the district is covered", () => {
    expect(isPostcodeInDistricts("ML3", DISTRICTS)).toBe(false);
  });

  it("rejects everything when no districts are configured", () => {
    expect(isPostcodeInDistricts("ML3 7PD", [])).toBe(false);
  });
});
