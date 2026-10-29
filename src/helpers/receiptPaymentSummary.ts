import type { Transaction } from "@/types/transaction.type";
import { TransactionStatus, TransactionType } from "@/common/enums/transaction";

/** Current debt balance plus the latest successful collection reconstructs the amount due before that collection. */
export function receiptPaymentSummary(remainingAmount: number, transactions: Transaction[]) {
  const successful = transactions
    .filter((item) => item.status === TransactionStatus.SUCCEEDED && item.type !== TransactionType.REFUND)
    .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latest = successful[0];
  const paidAmount = latest ? successful.filter((item) => new Date(item.processedAt).getTime() === new Date(latest.processedAt).getTime()).reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  return { paidAmount, remainingAmount, amountDue: remainingAmount + paidAmount };
}
