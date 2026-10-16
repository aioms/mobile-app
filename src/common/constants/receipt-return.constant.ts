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

export interface ReturnBadgeConfig {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const getReturnCardBadgeConfig = (
  status: string,
  operationType?: "return" | "exchange",
): ReturnBadgeConfig => {
  if (status === RECEIPT_RETURN_STATUS.COMPLETED) {
    if (operationType === "exchange") {
      return {
        label: "Đã đổi hàng",
        bgClass: "bg-blue-50",
        textClass: "text-blue-700",
        borderClass: "border-blue-200",
      };
    }
    return {
      label: "Đã hoàn tiền",
      bgClass: "bg-emerald-50",
      textClass: "text-emerald-700",
      borderClass: "border-emerald-200",
    };
  }

  if (status === RECEIPT_RETURN_STATUS.DRAFT) {
    return {
      label: "Chờ duyệt",
      bgClass: "bg-amber-50",
      textClass: "text-amber-700",
      borderClass: "border-amber-200",
    };
  }

  if (status === RECEIPT_RETURN_STATUS.PROCESSING) {
    return {
      label: "Đang xử lý",
      bgClass: "bg-purple-50",
      textClass: "text-purple-700",
      borderClass: "border-purple-200",
    };
  }

  if (status === RECEIPT_RETURN_STATUS.CANCELLED) {
    return {
      label: "Đã hủy",
      bgClass: "bg-rose-50",
      textClass: "text-rose-700",
      borderClass: "border-rose-200",
    };
  }

  return {
    label: status,
    bgClass: "bg-gray-50",
    textClass: "text-gray-700",
    borderClass: "border-gray-200",
  };
};

export const CUSTOMER_RETURN_REASONS = [
  "Sản phẩm lỗi",
  "Đổi sản phẩm",
  "Lý do khác",
] as const;

export const SUPPLIER_RETURN_REASONS = [
  "Ngừng bán",
  "Lỗi sản xuất",
  "Lý do khác",
] as const;

