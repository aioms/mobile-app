import { useMemo } from "react";
import {
  ICalculationResults,
  IEditableProductItem,
} from "../receiptDebtUpdate.d";

/**
 * Custom hook for calculating receipt debt totals and period-specific calculations
 */
export const useReceiptCalculations = (
  items: Record<string, IEditableProductItem[]>,
): ICalculationResults => {
  return useMemo(() => {
    const periodTotals: Record<string, { quantity: number; amount: number }> =
      {};
    let totalQuantity = 0;
    let totalAmount = 0;

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

      periodTotals[periodDate] = {
        quantity: periodQuantity,
        amount: periodAmount,
      };

      totalQuantity += periodQuantity;
      totalAmount += periodAmount;
    });

    return {
      totalQuantity,
      totalAmount,
      periodTotals,
    };
  }, [items]);
};

export default useReceiptCalculations;
