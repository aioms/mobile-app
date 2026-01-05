import { PaymentMethod } from "@/common/enums/payment";

// Enums
export enum ReceiptReturnStatus {
  DRAFT = "draft",
  PROCESSING = "processing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ReceiptReturnType {
  CUSTOMER = "customer",
  SUPPLIER = "supplier",
}

// Request DTOs
export interface CreateReceiptItemRequestDto {
  id: string;
  productId: string;
  productCode: number;
  productName: string;
  quantity: number;
  costPrice: number;
}

export interface CreateReceiptReturnRequestDto {
  note: string;
  totalQuantity: number;
  totalProduct: number;
  totalAmount: number;
  reason: string;
  supplier?: string; // id
  customer?: string; // id
  refId: string; // id of order or debt receipt
  refType: "order" | "debt";
  type: ReceiptReturnType;
  status: ReceiptReturnStatus;
  returnDate: string;
  items: CreateReceiptItemRequestDto[];
  paymentMethod?: PaymentMethod;
}

// Enhanced types for form management
export interface IReceiptReturnItem extends CreateReceiptItemRequestDto {
  // Additional properties for UI
  code: string;
  inventory?: number;
  originalQuantity?: number;
}

export interface IReceiptReturnFormData {
  note: string;
  reason: string;
  supplier?: string;
  customer?: string;
  refId: string;
  refType: "order" | "debt";
  type: ReceiptReturnType;
  returnDate: string;
  items: IReceiptReturnItem[];
  paymentMethod: PaymentMethod;
}
