import { describe, it, expect } from "vitest";
import { placesRemaining, isSlotFull, capacityLabel, parseCapacity, RELEASING_STATUSES } from "@/lib/slot-capacity";

describe("placesRemaining", () => {
  it("returns null for unlimited slots", () => {
    expect(placesRemaining({ capacity: null, booked: 99 })).toBeNull();
    expect(placesRemaining({ capacity: undefined as unknown as null, booked: 3 })).toBeNull();
  });

  it("subtracts bookings from capacity", () => {
    expect(placesRemaining({ capacity: 6, booked: 0 })).toBe(6);
    expect(placesRemaining({ capacity: 6, booked: 4 })).toBe(2);
    expect(placesRemaining({ capacity: 6, booked: 6 })).toBe(0);
  });

  it("never reports negative places when overbooked", () => {
    expect(placesRemaining({ capacity: 3, booked: 10 })).toBe(0);
  });

  it("treats a capacity of 0 as closed", () => {
    expect(placesRemaining({ capacity: 0, booked: 0 })).toBe(0);
  });
});

describe("isSlotFull", () => {
  it("is never full when unlimited", () => {
    expect(isSlotFull({ capacity: null, booked: 1000 })).toBe(false);
  });

  it("is not full below capacity", () => {
    expect(isSlotFull({ capacity: 4, booked: 3 })).toBe(false);
  });

  // The boundary that matters: the Nth booking fills the slot.
  it("is full exactly at capacity", () => {
    expect(isSlotFull({ capacity: 4, booked: 4 })).toBe(true);
  });

  it("is full when overbooked", () => {
    expect(isSlotFull({ capacity: 4, booked: 9 })).toBe(true);
  });

  it("is full when capacity is 0", () => {
    expect(isSlotFull({ capacity: 0, booked: 0 })).toBe(true);
  });
});

describe("capacityLabel", () => {
  it("says nothing for unlimited slots", () => {
    expect(capacityLabel({ capacity: null, booked: 2 })).toBeNull();
  });

  it("says nothing when there's plenty left", () => {
    expect(capacityLabel({ capacity: 10, booked: 0 })).toBeNull();
  });

  it("warns when running low", () => {
    expect(capacityLabel({ capacity: 6, booked: 4 })).toBe("2 places left");
  });

  it("uses the singular for the last place", () => {
    expect(capacityLabel({ capacity: 6, booked: 5 })).toBe("1 place left");
  });

  it("reports a full slot", () => {
    expect(capacityLabel({ capacity: 6, booked: 6 })).toBe("Fully booked");
    expect(capacityLabel({ capacity: 6, booked: 8 })).toBe("Fully booked");
  });

  it("respects a custom low threshold", () => {
    expect(capacityLabel({ capacity: 10, booked: 5 }, 5)).toBe("5 places left");
    expect(capacityLabel({ capacity: 10, booked: 4 }, 5)).toBeNull();
  });
});

describe("parseCapacity", () => {
  it("treats blank/null as unlimited", () => {
    expect(parseCapacity("")).toBeNull();
    expect(parseCapacity(null)).toBeNull();
    expect(parseCapacity(undefined)).toBeNull();
  });

  it("parses numeric strings from the dashboard input", () => {
    expect(parseCapacity("6")).toBe(6);
    expect(parseCapacity(6)).toBe(6);
  });

  it("keeps zero, which legitimately means closed", () => {
    expect(parseCapacity(0)).toBe(0);
    expect(parseCapacity("0")).toBe(0);
  });

  it("floors fractional input", () => {
    expect(parseCapacity("4.7")).toBe(4);
  });

  it("rejects negative and non-numeric input as unlimited rather than throwing", () => {
    expect(parseCapacity(-3)).toBeNull();
    expect(parseCapacity("abc")).toBeNull();
  });
});

describe("RELEASING_STATUSES", () => {
  // Guards the SQL: these statuses must not count against a slot, so a
  // cancelled order frees its place for someone else.
  it("releases a place for cancelled and refunded orders", () => {
    expect([...RELEASING_STATUSES]).toEqual(["cancelled", "refunded"]);
  });
});
