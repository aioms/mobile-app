import { describe, expect, it } from "vitest";
import { isValidImportDiscount } from "./receipt-import-pricing";
import { DiscountType } from "@/common/enums";
describe("import discount validation", () => {
  it("accepts three decimals and rejects invalid percentages", () => {
    for (const value of [0, 21.667, 100]) expect(isValidImportDiscount(value, 100000)).toBe(true);
    for (const value of [-1, 101, 21.6667, NaN, Infinity]) expect(isValidImportDiscount(value, 100000)).toBe(false);
  });
  it("validates fixed discounts per unit", () => {
    expect(isValidImportDiscount(10000, 20000, DiscountType.FIXED)).toBe(true);
    expect(isValidImportDiscount(30000, 20000, DiscountType.FIXED)).toBe(false);
  });
});
