import type { ReceiptReturnHistoryEntry } from "@/types/receipt-return.type";
import type { IProductItem } from "@/types/product.type";
import type { TReceiptDebtStatus, TReceiptDebtType } from "@/common/constants/receipt-debt.constant";
// Updated interfaces to match API response
export interface ReceiptDebt {
  id: string;
  code: string;
  type: TReceiptDebtType;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isOrderRevenue: boolean;
  status: TReceiptDebtStatus;
  dueDate: Date;
  paymentDate: Date | null;
  note?: string | null;
  createdAt: Date;
  supplierName: string;
  customerName: string;
  customer?: {
    id: string;
    name: string;
  };
}

export interface ReceiptPeriodSummary {
  id: string;
  discountAmount: number;
  vatAmount: number;
  adjustmentAmount?: number;
}

export interface ResponseData {
  receipt: ReceiptDebt | null;
  items: Record<string, IProductItem[]>;
  periods?: Record<string, ReceiptPeriodSummary>;
  returnHistory?: ReceiptReturnHistoryEntry[];
}
