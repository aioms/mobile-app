import { CustomerType, OrderStatus, PaymentMethod } from "../enums/order";

export const getOrderStatusLabel = (status: string): string => {
  switch (status) {
    case OrderStatus.DRAFT:
      return "Đơn nháp";
    case OrderStatus.PENDING:
      return "Chờ thanh toán";
    case OrderStatus.PAID:
      return "Đã hoàn thành";
    case OrderStatus.CANCELLED:
      return "Đã hủy";
    default:
      return "Không xác định";
  }
};

export const getOrderStatusColor = (status: string): string => {
  switch (status) {
    case OrderStatus.PENDING:
      return "warning";
    case OrderStatus.PAID:
      return "success";
    case OrderStatus.CANCELLED:
      return "danger";
    default:
      return "medium";
  }
};

export const getPaymentMethodLabel = (method: string): string => {
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

export const getCustomerTypeLabel = (type: string): string => {
  return type === CustomerType.LOYAL ? "Khách sỉ" : "Khách lẻ";
};

export const getCustomerTypeColor = (type: string): string => {
  return type === CustomerType.LOYAL
    ? "bg-blue-100 text-blue-700"
    : "bg-orange-100 text-orange-700";
};
