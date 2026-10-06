import { describe, expect, it } from "vitest";
import { calculateReturnTotals } from "./receipt-return-totals";
const original = [{ quantity: 18, price: 45000, vatRate: 8 }];
const selected = [{ id: "p", productId: "p", productCode: 1, productName: "Gốc", code: "P", quantity: 18, costPrice: 45000, vatRate: 8 }];
const exchange = [{ quantity: 18, unitPrice: 50000, vatRate: 8 }];
describe("exchange VAT settlement preview", () => {
  it("preserves original VAT and previews 90k goods difference", () => {
    const result = calculateReturnTotals(selected, exchange, original, false, true, 874800);
    expect(result.totalAmount).toBe(810000);
    expect(result.exchangeAmount - result.totalAmount).toBe(90000);
  });
  it("recalculates VAT when unchecked and keeps legacy plain return", () => {
    const result = calculateReturnTotals(selected, exchange, original, false, false, 874800);
    expect(result.totalAmount).toBe(874800);
    expect(result.exchangeAmount - result.totalAmount).toBe(97200);
  });
  it("allocates original goods discount independently of current order total", () => {
    const result = calculateReturnTotals(selected.map(item => ({ ...item, quantity: 9 })), exchange, original, false, true, 999999, 90000);
    expect(result.totalAmount).toBe(360000);
  });
  it("VAT-inclusive exchanges use original discount after prior exchanges", () => {
    const result = calculateReturnTotals(selected, exchange, original, false, false, 999999, 0, true);
    expect(result.totalAmount).toBe(874800);
    expect(result.exchangeAmount - result.totalAmount).toBe(97200);
  });
  it("keeps debt VAT policy: goods returned, replacements include VAT", () => {
    const result = calculateReturnTotals(selected, exchange, original, true, false);
    expect(result.totalAmount).toBe(810000);
    expect(result.exchangeAmount).toBe(972000);
  });
});
