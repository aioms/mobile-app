import { ReceiptPaymentStatus, ReceiptPaymentExpenseType } from "@/common/enums/receipt";
import { PaymentMethod } from "@/common/enums/payment";

export interface IReceiptPayment {
  id: string;
  code: string;
  type: ReceiptPaymentExpenseType;
  title: string;
  date: string; // YYYY-MM-DD format for easier date range comparison
  subjectName: string;
  amount: number;
  status: ReceiptPaymentStatus;
  paymentMethod: PaymentMethod;
  isDirectExport: boolean;
  note?: string;
  expenseTypeName?: string;
  paymentDate?: string;
  paymentObject?: string;
  notes?: string;
  supplierId?: string | null;
  supplierName?: string;
  receiptImportIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  user?: any;
  receiptImports?: any[];
}

export interface IReceiptPaymentOverview {
  totalAmountToday: number;
}
