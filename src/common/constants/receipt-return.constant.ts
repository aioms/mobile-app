export type TReceiptReturnStatus =
  (typeof RECEIPT_RETURN_STATUS)[keyof typeof RECEIPT_RETURN_STATUS];

export const RECEIPT_RETURN_STATUS = {
  DRAFT: "draft",
  PROCESSING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const getStatusColor = (status: TReceiptReturnStatus): string => {
  switch (status) {
    case RECEIPT_RETURN_STATUS.DRAFT:
      return "medium";

    case RECEIPT_RETURN_STATUS.PROCESSING:
      return "tertiary";

    case RECEIPT_RETURN_STATUS.COMPLETED:
      return "success";

    case RECEIPT_RETURN_STATUS.CANCELLED:
      return "danger";

    default:
      return "medium";
  }
};

export const getStatusLabel = (status: TReceiptReturnStatus): string => {
  switch (status) {
    case RECEIPT_RETURN_STATUS.DRAFT:
      return "Nháp";

    case RECEIPT_RETURN_STATUS.PROCESSING:
      return "Đang xử lý";

    case RECEIPT_RETURN_STATUS.COMPLETED:
      return "Hoàn thành";

    case RECEIPT_RETURN_STATUS.CANCELLED:
      return "Đã hủy";

    default:
      return "Unknown";
  }
};
