import { describe, expect, it } from "vitest";
import { receiptPaymentSummary } from "./receiptPaymentSummary";
import type { Transaction } from "@/types/transaction.type";
const transaction = (amount: number, day: number, status = 2, type = 1): Transaction => ({
  id: `${day}-${amount}`, code: "test", amount, description: "", paymentMethod: 1,
  status, type, processedAt: new Date(2026, 9, day), createdAt: new Date(2026, 9, day),
});
describe("receipt payment summary", () => {
  it("uses only the latest successful collection, excluding refunds and failures", () => {
    expect(receiptPaymentSummary(300, [transaction(100, 1), transaction(200, 2), transaction(90, 3, 3), transaction(50, 4, 2, 2)]))
      .toEqual({ paidAmount: 200, remainingAmount: 300, amountDue: 500 });
  });
  it("combines cash and transfer in the same collection", () => {
    expect(receiptPaymentSummary(0, [transaction(100, 2), transaction(200, 2)]).paidAmount).toBe(300);
  });
  it("shows outstanding debt before any collection", () => {
    expect(receiptPaymentSummary(500, [])).toEqual({ paidAmount: 0, remainingAmount: 500, amountDue: 500 });
  });
});
