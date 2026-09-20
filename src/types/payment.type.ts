import { PaymentMethod } from "@/common/enums/payment";
import { TransactionType } from "@/common/enums/transaction";

export interface PaymentTransactionDto {
  amount: number;
  paymentMethod: PaymentMethod;
  type: TransactionType;
  note?: string;
}

export interface OrderPaymentDetails {
  totalAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  status: number;
  transactions: Array<{
    id: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: number;
    note?: string | null;
    processedAt: string;
  }>;
}

export interface PayDebtRequestDto {
  transactions: PaymentTransactionDto[];
  note?: string;
}
