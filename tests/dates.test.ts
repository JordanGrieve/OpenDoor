import { describe, it, expect } from "vitest";
import { isoDate, earliestFulfilmentDate, fulfilmentDateOptions, prettyDate } from "@/lib/dates";

// Fixed reference points (local time, no timezone drift for date-only values).
const WED = new Date(2026, 6, 8); // Wed 8 Jul 2026
const SAT = new Date(2026, 6, 11); // Sat 11 Jul 2026

describe("isoDate", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(isoDate(WED)).toBe("2026-07-08");
  });

  it("zero-pads month and day", () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("does not drift across a month boundary", () => {
    expect(isoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("earliestFulfilmentDate", () => {
  it("adds the lead time in days", () => {
    expect(earliestFulfilmentDate(0, WED)).toBe("2026-07-08");
    expect(earliestFulfilmentDate(1, WED)).toBe("2026-07-09");
    expect(earliestFulfilmentDate(3, WED)).toBe("2026-07-11");
  });

  it("rolls over month boundaries", () => {
    expect(earliestFulfilmentDate(5, new Date(2026, 6, 30))).toBe("2026-08-04");
  });

  it("clamps negative lead times to today", () => {
    expect(earliestFulfilmentDate(-5, WED)).toBe("2026-07-08");
  });
});

describe("fulfilmentDateOptions", () => {
  it("starts no earlier than the lead time allows", () => {
    const opts = fulfilmentDateOptions(2, 14, WED);
    expect(opts[0] >= "2026-07-10").toBe(true);
  });

  it("never offers a Monday (kitchen closed)", () => {
    const opts = fulfilmentDateOptions(0, 21, WED);
    expect(opts.length).toBeGreaterThan(0);
    for (const iso of opts) {
      const day = new Date(iso + "T00:00:00").getDay();
      expect(day).not.toBe(1);
    }
  });

  it("returns dates in ascending order with no duplicates", () => {
    const opts = fulfilmentDateOptions(1, 14, SAT);
    expect([...opts].sort()).toEqual(opts);
    expect(new Set(opts).size).toBe(opts.length);
  });
});

describe("prettyDate", () => {
  it("renders a human label for the same calendar day", () => {
    // Parsed as local midnight, so the weekday must match the input date.
    expect(prettyDate("2026-07-11")).toContain("Sat");
    expect(prettyDate("2026-07-11")).toContain("11");
  });
});
