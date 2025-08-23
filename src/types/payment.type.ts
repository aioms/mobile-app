import { PaymentMethod } from "@/common/enums/payment";
import { TransactionType } from "@/common/enums/transaction";

export interface PaymentTransactionDto {
  amount: number;
  paymentMethod: PaymentMethod;
  type: TransactionType;
  note?: string;
}

export interface PayDebtRequestDto {
  transactions: PaymentTransactionDto[];
  note?: string;
}