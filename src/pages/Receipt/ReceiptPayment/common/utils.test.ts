import { describe, expect, it } from "vitest";
import { ReceiptPaymentExpenseType } from "@/common/enums/receipt";
import { EXPENSE_TYPE_LABELS, getPaymentReceiptTypeIcon } from "./utils";

describe("tax and social insurance payment categories", () => {
  it("shows the new categories in receipt labels", () => {
    expect(EXPENSE_TYPE_LABELS[ReceiptPaymentExpenseType.TAX]).toBe(
      "Thuế (GTGT/TNDN...)",
    );
    expect(EXPENSE_TYPE_LABELS[ReceiptPaymentExpenseType.SOCIAL_INSURANCE]).toBe(
      "BHXH",
    );
  });

  it("provides styles for receipt list cards", () => {
    expect(getPaymentReceiptTypeIcon(ReceiptPaymentExpenseType.TAX).label).toBe(
      "Thuế (GTGT/TNDN...)",
    );
    expect(
      getPaymentReceiptTypeIcon(ReceiptPaymentExpenseType.SOCIAL_INSURANCE).label,
    ).toBe("BHXH");
  });
});
