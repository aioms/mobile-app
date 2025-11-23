export type TReceiptDebtStatus =
  (typeof RECEIPT_DEBT_STATUS)[keyof typeof RECEIPT_DEBT_STATUS];

export const RECEIPT_DEBT_STATUS = {
  PENDING: "pending",
  PARTIAL_PAID: "partial_paid",
  COMPLETED: "completed",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
} as const;

export type TReceiptDebtType =
  (typeof RECEIPT_DEBT_TYPE)[keyof typeof RECEIPT_DEBT_TYPE];

export const RECEIPT_DEBT_TYPE = {
  CUSTOMER_DEBT: "customer_debt",
  SUPPLIER_DEBT: "supplier_debt",
} as const;

export const getStatusColor = (status: TReceiptDebtStatus): string => {
  switch (status) {
    case RECEIPT_DEBT_STATUS.PENDING:
      return "warning";

    case RECEIPT_DEBT_STATUS.PARTIAL_PAID:
      return "tertiary";

    case RECEIPT_DEBT_STATUS.COMPLETED:
      return "success";

    case RECEIPT_DEBT_STATUS.CANCELLED:
      return "danger";

    case RECEIPT_DEBT_STATUS.OVERDUE:
      return "dark";

    default:
      return "medium";
  }
};

export const getStatusLabel = (status: TReceiptDebtStatus): string => {
  switch (status) {
    case RECEIPT_DEBT_STATUS.PENDING:
      return "Chờ thanh toán";

    case RECEIPT_DEBT_STATUS.PARTIAL_PAID:
      return "Đã thu 1 nửa";

    case RECEIPT_DEBT_STATUS.COMPLETED:
      return "Hoàn thành";

    case RECEIPT_DEBT_STATUS.CANCELLED:
      return "Đã hủy";

    case RECEIPT_DEBT_STATUS.OVERDUE:
      return "Trễ hạn";

    default:
      return "Unknown";
  }
};
