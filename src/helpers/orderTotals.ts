export interface OrderTotalItem {
  price: number;
  quantity: number;
  vatRate?: number | null;
}

export interface OrderTotals {
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
}

/** Calculate order totals in whole VND using the backend's aggregate VAT rule. */
export function calculateOrderTotals(
  items: OrderTotalItem[],
  discountAmount: number,
  isInternalTransfer: boolean,
): OrderTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const vatAmount = isInternalTransfer
    ? 0
    : Math.round(items.reduce(
      (sum, item) =>
        sum + item.price * item.quantity * ((item.vatRate || 0) / 100),
      0,
    ));
  const roundedDiscount = isInternalTransfer
    ? 0
    : Math.round(discountAmount || 0);

  return {
    subtotal,
    vatAmount,
    discountAmount: roundedDiscount,
    totalAmount: Math.max(0, subtotal + vatAmount - roundedDiscount),
  };
}
