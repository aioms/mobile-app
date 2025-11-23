export interface CancelReceiptDebtRequestDto {
  note?: string;
}

export interface IReceiptItemPeriod {
  id: string;
  receiptId: string;
  receiptPeriodId: string;
  productId: string;
  productCode: number;
  code: string;
  productName: string;
  quantity: number;
  inventory: number;
  discount: number;
  costPrice: number;
  createdAt: string;
  updatedAt: string;
  // Additional properties used in the component
  originalQuantity?: number;
  isDeleted?: boolean;
}