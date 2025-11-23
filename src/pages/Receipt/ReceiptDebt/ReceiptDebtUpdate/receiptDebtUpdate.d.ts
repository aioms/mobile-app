import { IProductItem } from "@/types/product.type";
import { TReceiptDebtStatus, TReceiptDebtType } from "@/common/constants/receipt-debt.constant";

/**
 * Enhanced product item interface for editable receipt debt items
 */
export interface IEditableProductItem extends IProductItem {
  isEditing?: boolean;
  originalQuantity?: number;
  originalCostPrice?: number;
  hasChanges?: boolean;
}

/**
 * Receipt debt detail interface
 */
export interface IReceiptDebtDetail {
  id: string;
  code: string;
  type: TReceiptDebtType;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: TReceiptDebtStatus;
  dueDate: string;
  paymentDate: string | null;
  note: string;
  receiptImportId: string | null;
  receiptReturnId: string | null;
  createdAt: string;
  updatedAt: string;
  supplierName: string | null;
  customerName: string | null;
}

/**
 * Receipt debt detail response from API
 */
export interface ReceiptDebtDetailResponse {
  receipt: IReceiptDebtDetail;
  items: Record<string, IEditableProductItem[]>;
}

/**
 * Form data for receipt debt update
 */
export interface IReceiptDebtUpdateForm {
  customer: string;
  dueDate: string;
  note: string;
}

/**
 * Validation errors for form fields
 */
export interface IReceiptDebtUpdateErrors {
  customer?: string;
  dueDate?: string;
  note?: string;
  items?: Record<string, {
    quantity?: string;
    costPrice?: string;
  }>;
}

/**
 * Item change data for tracking modifications
 */
export interface IItemChangeData {
  id: string;
  quantity: number;
  costPrice: number;
  periodDate: string;
}

/**
 * Calculation results for totals
 */
export interface ICalculationResults {
  totalQuantity: number;
  totalAmount: number;
  periodTotals: Record<string, {
    quantity: number;
    amount: number;
  }>;
}

/**
 * Props for editable product item component
 */
export interface IEditableProductItemProps {
  item: IEditableProductItem;
  periodDate: string;
  isDisabled: boolean;
  onItemChange: (data: IItemChangeData) => void;
  onToggleEdit: (itemId: string) => void;
}

/**
 * Props for enhanced purchase period list
 */
export interface IEnhancedPurchasePeriodListProps {
  items: Record<string, IEditableProductItem[]>;
  receiptStatus: TReceiptDebtStatus;
  onItemsChange: (updatedItems: Record<string, IEditableProductItem[]>) => void;
  calculations: ICalculationResults;
}