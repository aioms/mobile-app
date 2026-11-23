import { describe, expect, it } from "vitest";
import { activeReceiptItems, remainingReceiptQuantity } from "./receipt-remaining-items";
describe("receipt return display", () => {
  it("hides fully returned rows without mutating history", () => {
    const rows = [{ quantity: 1, returnedQuantity: 1 }, { quantity: 5, returnedQuantity: 2 }];
    expect(activeReceiptItems(rows)).toEqual([rows[1]]);
    expect(remainingReceiptQuantity(rows[1])).toBe(3);
    expect(rows).toHaveLength(2);
  });
  it("shows same-day readdition while preserving returned amount", () => {
    const row = { quantity: 2, returnedQuantity: 1 };
    expect(activeReceiptItems([row])).toEqual([row]);
    expect(remainingReceiptQuantity(row)).toBe(1);
    expect(activeReceiptItems([{ quantity: 1, returnedQuantity: 1 }])).toEqual([]);
  });
});
