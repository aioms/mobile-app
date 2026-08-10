import { useMemo } from "react";
import {
  ICalculationResults,
  IEditableProductItem,
  ReceiptPeriodSummary,
} from "../receiptDebtUpdate.d";

/**
 * Custom hook for calculating receipt debt totals and period-specific calculations
 */
export const useReceiptCalculations = (
  items: Record<string, IEditableProductItem[]>,
  periods: Record<string, ReceiptPeriodSummary> = {},
): ICalculationResults => {
  return useMemo(() => {
    const periodTotals: Record<
      string,
      { quantity: number; amount: number; vatAmount: number; totalWithVat: number }
    > = {};
    let totalQuantity = 0;
    let totalAmount = 0;
    let totalVatAmount = 0;

    // Calculate totals for each period
    Object.entries(items).forEach(([periodDate, periodItems]) => {
      let periodQuantity = 0;
      let periodAmount = 0;

      periodItems.forEach((item) => {
        // Calculate effective quantity excluding returned items
        const returnedQty = item.returnedQuantity || 0;
        const effectiveQuantity = Math.max(
          0,
          (item.quantity || 0) - returnedQty,
        );
        const itemCostPrice = item.costPrice || 0;
        const itemTotal = effectiveQuantity * itemCostPrice;

        periodQuantity += effectiveQuantity;
        periodAmount += itemTotal;
      });

      const vatAmount = periods[periodDate]?.vatAmount || 0;

      periodTotals[periodDate] = {
        quantity: periodQuantity,
        amount: periodAmount,
        vatAmount,
        totalWithVat: periodAmount + vatAmount,
      };

      totalQuantity += periodQuantity;
      totalAmount += periodAmount;
      totalVatAmount += vatAmount;
    });

    return {
      totalQuantity,
      totalAmount: totalAmount + totalVatAmount,
      totalVatAmount,
      periodTotals,
    };
  }, [items, periods]);
};

export default useReceiptCalculations;
