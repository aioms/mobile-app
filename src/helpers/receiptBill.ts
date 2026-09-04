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
  vatAmount: number;
}

/** Full bill data ready for rendering */
export interface ReceiptBillData {
  periodGroups: BillPeriodGroup[];
  subtotal: number;
  totalVat: number;
  grandTotal: number;
}

interface PeriodSummary {
  id: string;
  vatAmount: number;
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
  let totalVat = 0;

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

    if (lineItems.length === 0) continue;

    const vatAmount = periods[date]?.vatAmount ?? 0;
    totalVat += vatAmount;
    subtotal += periodTotal;

    periodGroups.push({
      date,
      formattedDate: dayjs(date).format("DD/MM/YYYY"),
      items: lineItems,
      periodTotal,
      vatAmount,
    });
  }

  return {
    periodGroups,
    subtotal,
    totalVat,
    grandTotal: subtotal + totalVat,
  };
}
