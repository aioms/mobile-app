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
  receiptItemId?: string;
  productId: string;
  productCode: number;
  productName: string;
  quantity: number;
  costPrice: number;
  metadata?: {
    returnedQuantity: number;
    periodId?: string;
    sourceReceiptItemId?: string;
  };
}

export interface CreateReceiptReturnRequestDto {
  note: string;
  totalQuantity: number;
  totalProduct: number;
  totalAmount: number;
  reason: string;
  supplier?: string; // id
  customer?: string; // id
  refId?: string; // id of order or debt receipt
  refType?: "order" | "debt";
  type: ReceiptReturnType;
  status: ReceiptReturnStatus;
  returnDate: string;
  items: CreateReceiptItemRequestDto[];
  paymentMethod?: PaymentMethod;
  operationType?: "return" | "exchange";
  vatHandling?: "preserve" | "recalculate";
  exchangeItems?: Array<{
    productId: string;
    productCode: string | number;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice?: number;
    /** VAT percentage on the replacement product, applied to unitPrice. */
    vatRate?: number;
  }>;
  requestId?: string;
}

// Enhanced types for form management
export interface IReceiptReturnItem extends CreateReceiptItemRequestDto {
  // Additional properties for UI
  code: string;
  inventory?: number;
  originalQuantity?: number;
  vatRate?: number;
}

export interface IReceiptReturnFormData {
  note: string;
  reason: string;
  customReason?: string;
  supplier?: string;
  customer?: string;
  refId?: string;
  refType?: "order" | "debt";
  type: ReceiptReturnType;
  returnDate: string;
  items: IReceiptReturnItem[];
  paymentMethod: PaymentMethod;
}

export interface ReceiptReturnHistoryEntry {
  id: string;
  receiptNumber: string;
  operationType: "return" | "exchange";
  status?: ReceiptReturnStatus;
  accountingVersion?: number;
  originalReturnAmount: number;
  replacementAmount: number;
  differenceAmount: number;
  exchangeItems?: Array<{ productName: string; quantity: number; unitPrice: number; vatRate?: number; vatHandling?: "preserve" | "recalculate" }>;
  returnDate?: string;
}

export interface IReceiptReturnPartner {
  id: string;
  name: string;
  phone?: string;
  group?: string; // e.g. "Khách quen" | "Khách sỉ" | "Khách lẻ" | "NCC chính" | "NCC đối tác"
  address?: string;
}

export interface IReceiptReturnItemDetail {
  id?: string;
  productId: string;
  productCode: string | number;
  code?: string;
  productName: string;
  quantity: number;
  costPrice?: number;
  unitPrice?: number;
}

export interface IReceiptReturn {
  id: string;
  receiptNumber: string;
  note?: string;
  reason?: string;
  totalQuantity: number;
  totalProduct: number;
  totalAmount: number;
  originalReturnAmount?: number;
  replacementAmount?: number;
  differenceAmount?: number;
  store?: string;
  customer?: IReceiptReturnPartner;
  supplier?: IReceiptReturnPartner;
  returnDate: string;
  status: ReceiptReturnStatus;
  type: ReceiptReturnType;
  operationType?: "return" | "exchange";
  refType?: "order" | "debt";
  refId?: string;
  accountingVersion?: number;
  paymentMethod?: PaymentMethod;
  items?: IReceiptReturnItemDetail[];
  exchangeItems?: Array<{
    productId: string;
    productCode: string | number;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice?: number;
    vatRate?: number;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface IReceiptReturnSummary {
  totalCount: number;
  totalAmount: number;
  trendPercent?: number;
  statusCounts: {
    all: number;
    draft: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
}

export interface IReceiptReturnFilter {
  keyword?: string;
  type?: ReceiptReturnType;
  status?: string;
  startDate?: string;
  endDate?: string;
  returnDate?: string;
  operationType?: "return" | "exchange" | "all";
}

