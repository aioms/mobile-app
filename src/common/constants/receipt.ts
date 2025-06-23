export const RECEIPT_IMPORT_STATUS = {
  DRAFT: "draft",
  WAITING: "waiting",
  PROCESSING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  SHORT_RECEIVED: "short_received",
  OVER_RECEIVED: "over_received",
} as const;

export const RECEIPT_RETURN_STATUS = {
  DRAFT: "draft",
  PROCESSING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const RECEIPT_CHECK_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  BALANCING_REQUIRED: "balancing_required",
  BALANCED: "balanced",
} as const;

export const RECEIPT_DEBT_STATUS = {
  PENDING: "pending",
  PARTIAL_PAID: "partial_paid",
  COMPLETED: "completed",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
} as const;

export type TReceiptImportStatus =
  (typeof RECEIPT_IMPORT_STATUS)[keyof typeof RECEIPT_IMPORT_STATUS];

export type TReceiptReturnStatus =
  (typeof RECEIPT_RETURN_STATUS)[keyof typeof RECEIPT_RETURN_STATUS];

export type TReceiptCheckStatus =
  (typeof RECEIPT_CHECK_STATUS)[keyof typeof RECEIPT_CHECK_STATUS];

export type TReceiptDebtStatus =
  (typeof RECEIPT_DEBT_STATUS)[keyof typeof RECEIPT_DEBT_STATUS];

export type ReceiptStatus =
  | TReceiptImportStatus
  | TReceiptReturnStatus
  | TReceiptCheckStatus
  | TReceiptDebtStatus
  | "unknown";

export const getStatusColor = (status: ReceiptStatus): string => {
  switch (status) {
    case RECEIPT_IMPORT_STATUS.DRAFT:
    case RECEIPT_RETURN_STATUS.DRAFT:
      return "medium";

    case RECEIPT_CHECK_STATUS.PENDING:
    case RECEIPT_IMPORT_STATUS.WAITING:
    case RECEIPT_DEBT_STATUS.PENDING:
      return "warning";

    case RECEIPT_IMPORT_STATUS.PROCESSING:
    case RECEIPT_RETURN_STATUS.PROCESSING:
    case RECEIPT_CHECK_STATUS.PROCESSING:
    case RECEIPT_DEBT_STATUS.PARTIAL_PAID:
      return "tertiary";

    case RECEIPT_IMPORT_STATUS.COMPLETED:
    case RECEIPT_RETURN_STATUS.COMPLETED:
    case RECEIPT_CHECK_STATUS.BALANCED:
    case RECEIPT_DEBT_STATUS.COMPLETED:
      return "success";

    case RECEIPT_IMPORT_STATUS.CANCELLED:
    case RECEIPT_RETURN_STATUS.CANCELLED:
    case RECEIPT_CHECK_STATUS.BALANCING_REQUIRED:
    case RECEIPT_DEBT_STATUS.CANCELLED:
      return "danger";

    case RECEIPT_IMPORT_STATUS.SHORT_RECEIVED:
    case RECEIPT_IMPORT_STATUS.OVER_RECEIVED:
    case RECEIPT_DEBT_STATUS.OVERDUE:
      return "dark";

    default:
      return "medium";
  }
};

export const getStatusLabel = (status: ReceiptStatus): string => {
  switch (status) {
    case RECEIPT_IMPORT_STATUS.DRAFT:
    case RECEIPT_RETURN_STATUS.DRAFT:
      return "Nháp";

    case RECEIPT_CHECK_STATUS.PENDING:
    case RECEIPT_DEBT_STATUS.PENDING:
      return "Chờ xử lý";

    case RECEIPT_DEBT_STATUS.PARTIAL_PAID:
      return "Đã thu 1 nửa";

    case RECEIPT_IMPORT_STATUS.PROCESSING:
    case RECEIPT_RETURN_STATUS.PROCESSING:
    case RECEIPT_CHECK_STATUS.PROCESSING:
      return "Đang xử lý";

    case RECEIPT_IMPORT_STATUS.WAITING:
      return "Đang chờ duyệt";

    case RECEIPT_IMPORT_STATUS.COMPLETED:
    case RECEIPT_RETURN_STATUS.COMPLETED:
    case RECEIPT_DEBT_STATUS.COMPLETED:
      return "Hoàn thành";

    case RECEIPT_DEBT_STATUS.OVERDUE:
      return "Trễ hạn";

    case RECEIPT_IMPORT_STATUS.CANCELLED:
    case RECEIPT_RETURN_STATUS.CANCELLED:
    case RECEIPT_DEBT_STATUS.CANCELLED:
      return "Đã hủy";

    case RECEIPT_IMPORT_STATUS.SHORT_RECEIVED:
      return "Giao thiếu";

    case RECEIPT_IMPORT_STATUS.OVER_RECEIVED:
      return "Giao dư";

    case RECEIPT_CHECK_STATUS.BALANCING_REQUIRED:
      return "Cần cân bằng";

    case RECEIPT_CHECK_STATUS.BALANCED:
      return "Đã cân bằng";

    default:
      return "Unknown";
  }
};
