export enum PaymentStatus {
  PAID = 0,
  PARTIALLY_PAID = 1,
  CANCELLED = 2,
}

export enum PaymentMethod {
  CASH = 1,
  BANK_TRANSFER = 2,
  CREDIT_CARD = 3,
}

export enum PaymentType {
  ORDER = 1,
  RECEIPT_DEBT = 2,
}