import { describe, expect, it } from "vitest";
import { buildReceiptBill } from "./receiptBill";
import { IProductItem } from "@/types/product.type";

describe("buildReceiptBill", () => {
  it("includes recipientName for each line item if available", () => {
    const items: Record<string, IProductItem[]> = {
      "2026-10-23": [
        {
          id: "item-1",
          code: "SP001",
          receiptId: "debt-1",
          productId: "prod-1",
          productName: "Sản phẩm A",
          productCode: 1,
          quantity: 2,
          costPrice: 50_000,
          createdAt: "2026-10-23T10:00:00Z",
          recipientName: "Nguyễn Văn A",
        },
        {
          id: "item-2",
          code: "SP002",
          receiptId: "debt-1",
          productId: "prod-2",
          productName: "Sản phẩm B",
          productCode: 2,
          quantity: 1,
          costPrice: 100_000,
          createdAt: "2026-10-23T10:00:00Z",
          metadata: {
            recipientName: "Trần Thị B",
          },
        },
      ],
    };

    const periods = {
      "2026-10-23": {
        id: "period-1",
        discountAmount: 0,
        vatAmount: 0,
      },
    };

    const bill = buildReceiptBill(items, periods, ["2026-10-23"]);

    expect(bill.periodGroups).toHaveLength(1);
    expect(bill.periodGroups[0].items).toHaveLength(2);
    expect(bill.periodGroups[0].items[0]).toEqual({
      productName: "Sản phẩm A",
      recipientName: "Nguyễn Văn A",
      quantity: 2,
      unitPrice: 50_000,
      lineTotal: 100_000,
    });
    expect(bill.periodGroups[0].items[1]).toEqual({
      productName: "Sản phẩm B",
      recipientName: "Trần Thị B",
      quantity: 1,
      unitPrice: 100_000,
      lineTotal: 100_000,
    });
    expect(bill.subtotal).toBe(200_000);
    expect(bill.grandTotal).toBe(200_000);
  });
});
