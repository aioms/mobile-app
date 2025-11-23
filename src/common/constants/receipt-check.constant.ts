export type TReceiptCheckStatus =
  (typeof RECEIPT_CHECK_STATUS)[keyof typeof RECEIPT_CHECK_STATUS];

export const RECEIPT_CHECK_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  BALANCING_REQUIRED: "balancing_required",
  BALANCED: "balanced",
} as const;

export const getStatusColor = (status: TReceiptCheckStatus): string => {
  switch (status) {
    case RECEIPT_CHECK_STATUS.PENDING:
    case RECEIPT_CHECK_STATUS.BALANCING_REQUIRED:
      return "warning";

    case RECEIPT_CHECK_STATUS.PROCESSING:
      return "tertiary";

    case RECEIPT_CHECK_STATUS.BALANCED:
      return "success";

    default:
      return "medium";
  }
};

export const getStatusLabel = (status: TReceiptCheckStatus): string => {
  switch (status) {
    case RECEIPT_CHECK_STATUS.PENDING:
      return "Chờ xử lý";

    case RECEIPT_CHECK_STATUS.PROCESSING:
      return "Đang xử lý";

    case RECEIPT_CHECK_STATUS.BALANCING_REQUIRED:
      return "Cần cân bằng";

    case RECEIPT_CHECK_STATUS.BALANCED:
      return "Đã cân bằng";

    default:
      return "Unknown";
  }
};

export const RECEIPT_CHECK_REASONS = [
  { value: "input_error", label: "Sai sót nhập liệu" },
  { value: "damage", label: "Mất hàng / Hư hỏng" },
  { value: "wrong_import", label: "Nhập kho sai" },
  { value: "other", label: "Khác (nhập ghi chú cụ thể)" },
];
