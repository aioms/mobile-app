import { ReceiptDebtStatus } from "@/common/enums/receipt";

export interface CancelReceiptDebtRequestDto {
  note?: string;
}

export interface IReceiptDebt {
  id: string;
  code: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: ReceiptDebtStatus;
  note?: string;
  customerId?: string;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
  items: IReceiptItemPeriod[];
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
  returnedQuantity?: number;
  inventory: number;
  discount: number;
  costPrice: number;
  createdAt: string;
  updatedAt: string;
  // Additional properties used in the component
  originalQuantity?: number;
  isDeleted?: boolean;
  shipNow?: boolean;
  metadata?: Record<string, any>;
  sellingPrice?: number;
}
