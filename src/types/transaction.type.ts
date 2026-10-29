import { PaymentMethod } from "@/common/enums/payment";
import { TransactionStatus } from "@/common/enums/transaction";

export interface Transaction {
  id: string;
  type?: number;
  code: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  processedAt: Date;
  createdAt: Date;
}

export interface TransactionListResponse {
  transactions: Transaction[];
}