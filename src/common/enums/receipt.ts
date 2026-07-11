export enum ReceiptImportStatus {
  DRAFT = "draft",
  PROCESSING = "processing",
  WAITING = "waiting",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  SHORT_RECEIVED = "short_received",
  OVER_RECEIVED = "over_received",
  PAID = "paid",
}

export enum ReceiptReturnStatus {
  DRAFT = "draft",
  PROCESSING = "processing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ReceiptCheckStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  BALANCING_REQUIRED = "balancing_required",
  BALANCED = "balanced",
}

export enum ReceiptReturnType {
  CUSTOMER = "customer",
  SUPPLIER = "supplier",
}

export enum ReceiptDebtStatus {
  PENDING = "pending",
  PARTIAL_PAID = "partial_paid",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ReceiptPaymentStatus {
  DRAFT = "draft",
  PAID = "paid",
  DEBT_PAYMENT = "debt_payment",
  CANCELLED = "cancelled",
}

export enum ReceiptPaymentExpenseType {
  SUPPLIER_PAYMENT = "supplier_payment",
  TRANSPORTATION = "transportation",
  UTILITIES = "utilities",
  RENT = "rent",
  LABOR = "labor",
  OTHER = "other",
  CASH_WITHDRAWAL_SANG = "cash_withdrawal_sang",
}
