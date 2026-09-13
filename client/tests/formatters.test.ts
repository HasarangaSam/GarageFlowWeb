import { describe, expect, it } from "vitest";
import { formatCurrency, calculateLineTotal } from "../src/utils/formatters";

describe("formatCurrency", () => {
  it("formats a whole amount as Sri Lankan Rupees", () => {
    expect(formatCurrency(25000)).toBe("Rs. 25,000.00");
  });

  it("uses zero when no amount is supplied", () => {
    expect(formatCurrency(0)).toBe("Rs. 0.00");
  });
});

describe("calculateLineTotal", () => {
  it("multiplies quantity by the unit price", () => {
    expect(calculateLineTotal(3, 1500)).toBe(4500);
  });

  it("does not return a negative invoice amount", () => {
    expect(calculateLineTotal(-1, 1000)).toBe(0);
    expect(calculateLineTotal(1, -1000)).toBe(0);
  });
});
