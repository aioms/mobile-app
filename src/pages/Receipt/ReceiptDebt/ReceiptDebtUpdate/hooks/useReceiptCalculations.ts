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
      {
        quantity: number;
        amount: number;
        discountAmount: number;
        vatAmount: number;
        totalWithVat: number;
      }
    > = {};
    let totalQuantity = 0;
    let grandTotal = 0;
    let totalDiscountAmount = 0;
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

      const discountAmount = periods[periodDate]?.discountAmount || 0;
      const vatAmount = periods[periodDate]?.vatAmount || 0;

      periodTotals[periodDate] = {
        quantity: periodQuantity,
        amount: periodAmount,
        discountAmount,
        vatAmount,
        totalWithVat: Math.max(0, periodAmount - discountAmount) + vatAmount,
      };

      totalQuantity += periodQuantity;
      totalDiscountAmount += discountAmount;
      totalVatAmount += vatAmount;
      grandTotal += Math.max(0, periodAmount - discountAmount) + vatAmount;
    });

    return {
      totalQuantity,
      totalAmount: grandTotal,
      totalDiscountAmount,
      totalVatAmount,
      periodTotals,
    };
  }, [items, periods]);
};

export default useReceiptCalculations;
