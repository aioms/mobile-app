export interface DmsgInput {
  invoiceTotal: number;
  totalCost: number;
  vatRate: number;
  commissionRate: number;
  invoiceFee: number;
}

export interface DmsgFinancials extends DmsgInput {
  enteredFields?: string[];
  formulaVersion: 1;
  beforeVat: number;
  vatAmount: number;
  revenue: number;
  commissionAmount: number;
  customerTransfer: number;
  profit: number;
}

export type DmsgSettlementKind = "receipt" | "customer_transfer" | "invoice_fee" | "refund";
export interface DmsgEvent {
  id: string; kind: DmsgSettlementKind | "edit"; amount: number;
  paymentMethod: "cash" | "bank_transfer" | null; processedAt: string; note: string | null;
}
export interface DmsgSettlements { received: number; customerTransferred: number; feesPaid: number; refunded: number; netReceived: number; }
export interface DmsgSummary { count: number; revenue: number; totalCost: number; invoiceFee: number; profit: number; customerTransfer: number; }

export interface DmsgAttachment { fileId: string; kind: "cost_image" | "invoice_pdf"; }
