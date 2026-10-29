import { ReceiptReturnType } from "@/types/receipt-return.type";

interface CatalogPrices {
  costPrice?: number | null;
  sellingPrice?: number | null;
}

/** Supplier returns use purchase cost; a zero cost must never fall back to selling price. */
export function getCatalogReturnPrice(product: CatalogPrices, type: ReceiptReturnType): number {
  return type === ReceiptReturnType.SUPPLIER
    ? product.costPrice ?? 0
    : product.sellingPrice || product.costPrice || 0;
}
