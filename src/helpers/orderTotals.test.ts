import { describe, expect, it } from "vitest";
import { calculateOrderTotals } from "./orderTotals";

describe("calculateOrderTotals", () => {
  it("rounds aggregate VAT to an integer VND payable amount", () => {
    const result = calculateOrderTotals([
      { price: 150_000, quantity: 1, vatRate: 0 },
      { price: 380_000, quantity: 1, vatRate: 8 },
      { price: 350_000, quantity: 1, vatRate: 8 },
      { price: 3_667, quantity: 60, vatRate: 8 },
      { price: 3_000, quantity: 40, vatRate: 8 },
    ], 0, false);

    expect(result).toEqual({
      subtotal: 1_220_020,
      vatAmount: 85_602,
      discountAmount: 0,
      totalAmount: 1_305_622,
    });
  });

  it("rounds discounts and applies internal-transfer totals", () => {
    expect(calculateOrderTotals([
      { price: 100_000, quantity: 1, vatRate: 8 },
    ], 1_234.6, false)).toMatchObject({
      discountAmount: 1_235,
      totalAmount: 106_765,
    });
    expect(calculateOrderTotals([
      { price: 100_000, quantity: 1, vatRate: 8 },
    ], 1_234.6, true)).toMatchObject({
      vatAmount: 0,
      discountAmount: 0,
      totalAmount: 100_000,
    });
  });
});
