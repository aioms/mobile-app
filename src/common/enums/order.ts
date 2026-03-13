export enum OrderStatus {
  DRAFT = "draft",
  PENDING = "pending",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  RETURNED = "returned",
}

export enum PaymentMethod {
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  CREDIT_CARD = "credit_card",
}

export enum DiscountType {
  FIXED = "fixed",
  PERCENTAGE = "percentage",
}
export enum OrderType {
  SALES = "sales",
  INTERNAL_TRANSFER = "internal_transfer",
}
