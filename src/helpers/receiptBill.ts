import dayjs from "dayjs";
import { IProductItem } from "@/types/product.type";

/** A single line item on the exported bill */
export interface BillLineItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/** One period (date group) on the bill */
export interface BillPeriodGroup {
  date: string;
  formattedDate: string;
  items: BillLineItem[];
  periodTotal: number;
  discountAmount: number;
  vatAmount: number;
  adjustmentAmount?: number;
}

/** Full bill data ready for rendering */
export interface ReceiptBillData {
  periodGroups: BillPeriodGroup[];
  subtotal: number;
  totalDiscount: number;
  totalVat: number;
  totalAdjustment: number;
  grandTotal: number;
}

interface PeriodSummary {
  id: string;
  discountAmount: number;
  vatAmount: number;
  adjustmentAmount?: number;
}

/**
 * Build the bill data from receipt items grouped by period date.
 * Only includes selected periods. Quantity accounts for returned items.
 */
export function buildReceiptBill(
  items: Record<string, IProductItem[]>,
  periods: Record<string, PeriodSummary>,
  selectedPeriodDates: string[],
): ReceiptBillData {
  const periodGroups: BillPeriodGroup[] = [];
  let subtotal = 0;
  let totalDiscount = 0;
  let totalVat = 0;
  let totalAdjustment = 0;
  let grandTotal = 0;

  // Sort selected dates chronologically (ascending = oldest first on bill)
  const sortedDates = [...selectedPeriodDates].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  for (const date of sortedDates) {
    const periodItems = items[date];
    if (!periodItems || periodItems.length === 0) continue;

    const lineItems: BillLineItem[] = [];
    let periodTotal = 0;

    for (const item of periodItems) {
      const returned = item.returnedQuantity ?? 0;
      const qty = Math.max(0, item.quantity - returned);
      if (qty === 0) continue;

      const unitPrice = item.costPrice;
      const lineTotal = qty * unitPrice;
      periodTotal += lineTotal;

      lineItems.push({
        productName: item.productName,
        quantity: qty,
        unitPrice,
        lineTotal,
      });
    }

    const discountAmount = periods[date]?.discountAmount ?? 0;
    const vatAmount = periods[date]?.vatAmount ?? 0;
    const adjustmentAmount = periods[date]?.adjustmentAmount ?? 0;
    if (
      lineItems.length === 0 &&
      discountAmount === 0 &&
      vatAmount === 0 && adjustmentAmount === 0
    ) continue;

    totalDiscount += Math.min(periodTotal, discountAmount);
    totalAdjustment += adjustmentAmount;
    totalVat += vatAmount;
    subtotal += periodTotal;
    grandTotal += Math.max(0, periodTotal - discountAmount) + vatAmount + adjustmentAmount;

    periodGroups.push({
      date,
      formattedDate: dayjs(date).format("DD/MM/YYYY"),
      items: lineItems,
      periodTotal,
      discountAmount: Math.min(periodTotal, discountAmount),
      vatAmount,
      adjustmentAmount,
    });
  }

  return {
    periodGroups,
    subtotal,
    totalDiscount,
    totalVat,
    totalAdjustment,
    grandTotal: Math.max(0, grandTotal),
  };
}
