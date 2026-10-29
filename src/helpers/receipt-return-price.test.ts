import { describe, expect, it } from "vitest";
import { ReceiptReturnType } from "@/types/receipt-return.type";
import { getCatalogReturnPrice } from "./receipt-return-price";

describe("catalog return prices", () => {
  it("uses purchase cost for supplier returns and selling price for customer returns", () => {
    const product = { costPrice: 40000, sellingPrice: 100000 };
    expect(getCatalogReturnPrice(product, ReceiptReturnType.SUPPLIER)).toBe(40000);
    expect(getCatalogReturnPrice(product, ReceiptReturnType.CUSTOMER)).toBe(100000);
  });
  it("keeps zero or missing supplier cost from falling back to selling price", () => {
    expect(getCatalogReturnPrice({ costPrice: 0, sellingPrice: 100000 }, ReceiptReturnType.SUPPLIER)).toBe(0);
    expect(getCatalogReturnPrice({ sellingPrice: 100000 }, ReceiptReturnType.SUPPLIER)).toBe(0);
  });
});
