export type TReceiptImportStatus =
  (typeof RECEIPT_IMPORT_STATUS)[keyof typeof RECEIPT_IMPORT_STATUS];

export const RECEIPT_IMPORT_STATUS = {
  DRAFT: "draft",
  WAITING: "waiting",
  PROCESSING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  SHORT_RECEIVED: "short_received",
  OVER_RECEIVED: "over_received",
} as const;

export const getStatusColor = (status: TReceiptImportStatus): string => {
  switch (status) {
    case RECEIPT_IMPORT_STATUS.DRAFT:
      return "medium";

    case RECEIPT_IMPORT_STATUS.WAITING:
      return "warning";

    case RECEIPT_IMPORT_STATUS.PROCESSING:
      return "tertiary";

    case RECEIPT_IMPORT_STATUS.COMPLETED:
      return "success";

    case RECEIPT_IMPORT_STATUS.CANCELLED:
      return "danger";

    case RECEIPT_IMPORT_STATUS.SHORT_RECEIVED:
    case RECEIPT_IMPORT_STATUS.OVER_RECEIVED:
      return "dark";

    default:
      return "medium";
  }
};

export const getStatusLabel = (status: TReceiptImportStatus): string => {
  switch (status) {
    case RECEIPT_IMPORT_STATUS.DRAFT:
      return "Nháp";

    case RECEIPT_IMPORT_STATUS.PROCESSING:
      return "Đang xử lý";

    case RECEIPT_IMPORT_STATUS.WAITING:
      return "Đang chờ duyệt";

    case RECEIPT_IMPORT_STATUS.COMPLETED:
      return "Hoàn thành";

    case RECEIPT_IMPORT_STATUS.CANCELLED:
      return "Đã hủy";

    case RECEIPT_IMPORT_STATUS.SHORT_RECEIVED:
      return "Giao thiếu";

    case RECEIPT_IMPORT_STATUS.OVER_RECEIVED:
      return "Giao dư";

    default:
      return "Unknown";
  }
};
