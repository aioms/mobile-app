import type { IReceiptReturnItem } from "@/types/receipt-return.type";

interface ExchangeLine {
  quantity: number;
  unitPrice: number;
  vatRate?: number;
}
interface OrderLine {
  quantity: number;
  price: number;
  vatRate?: number;
}

/** Preserve mode settles discounted goods only; original VAT stays on the order. */
export function calculateReturnTotals(
  selected: IReceiptReturnItem[], exchange: ExchangeLine[], original: OrderLine[],
  isDebt: boolean, preserveVat: boolean, orderTotal?: number, orderDiscount = 0, orderExchange = false,
) {
  const originalAmount = original.reduce((sum, item) =>
    sum + item.price * item.quantity * (preserveVat ? 1 : 1 + (item.vatRate || 0) / 100), 0);
  const factor = !isDebt && originalAmount > 0
    ? preserveVat || orderExchange
      ? Math.min(1, Math.max(0, (originalAmount - orderDiscount) / originalAmount))
      : orderTotal !== undefined ? orderTotal / originalAmount : 1
    : 1;
  const returned = selected.reduce((sum, item) =>
    sum + item.costPrice * item.quantity * (isDebt || preserveVat ? 1 : 1 + (item.vatRate || 0) / 100), 0);
  return {
    totalProduct: selected.length,
    totalQuantity: selected.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: Math.round(returned * factor),
    exchangeAmount: exchange.reduce((sum, item) => sum + Math.round(
      item.quantity * item.unitPrice * (preserveVat ? 1 : 1 + (item.vatRate || 0) / 100)), 0),
  };
}
