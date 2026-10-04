export interface OrderDocumentLine {
  key: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
}

export interface OrderDocument {
  items: OrderDocumentLine[];
  totalQuantity: number;
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  adjustmentAmount: number;
  grandTotal: number;
}

export interface DocumentProps {
  order: import("./order.type").IOrder;
  kind: import("@/common/constants/order-document").DocumentKind;
  entity: import("@/common/constants/order-document").EntityHeader;
  issuedAt: string;
  authorName: string;
}
