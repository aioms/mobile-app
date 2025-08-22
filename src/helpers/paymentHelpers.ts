import { PaymentMethod } from "@/common/enums/payment";
import { TransactionStatus } from "@/common/enums/transaction";

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.CASH:
      return "Tiền mặt";
    case PaymentMethod.BANK_TRANSFER:
      return "Chuyển khoản";
    case PaymentMethod.CREDIT_CARD:
      return "Thẻ tín dụng";
    default:
      return "Không xác định";
  }
};

export const getTransactionStatusLabel = (status: TransactionStatus): string => {
  switch (status) {
    case TransactionStatus.PENDING:
      return "Đang xử lý";
    case TransactionStatus.SUCCEEDED:
      return "Thành công";
    case TransactionStatus.FAILED:
      return "Thất bại";
    default:
      return "Không xác định";
  }
};

export const getTransactionStatusColor = (status: TransactionStatus): string => {
  switch (status) {
    case TransactionStatus.PENDING:
      return "warning";
    case TransactionStatus.SUCCEEDED:
      return "success";
    case TransactionStatus.FAILED:
      return "danger";
    default:
      return "medium";
  }
};