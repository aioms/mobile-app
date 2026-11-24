interface ReceiptQuantity { quantity: number; returnedQuantity?: number }
export function remainingReceiptQuantity(item: ReceiptQuantity): number {
  return Math.max(0, item.quantity - (item.returnedQuantity || 0));
}
/** Filter for display only. Preserve canonical rows for persistence and return history. */
export function activeReceiptItems<T extends ReceiptQuantity>(items: T[]): T[] {
  return items.filter(item => remainingReceiptQuantity(item) > 0);
}
