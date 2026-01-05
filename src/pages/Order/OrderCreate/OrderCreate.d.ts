export interface IOrderItemEnhanced {
  id: string;
  productId: string;
  productName: string;
  code: string;
  quantity: number;
  sellingPrice: number;
  vatRate?: number;
  inventory?: number;
  shipNow?: boolean;
}

export interface IOrderItemSubmission {
  productId: string;
  productName: string;
  code: string;
  quantity: number;
  price: number;
  vatRate?: number;
  shipNow: boolean;
}

export interface IOrderSubmissionData {
  status: string;
  customer: string;
  paymentMethod: string;
  note: string;
  discountAmount: number;
  items: IOrderItemSubmission[];
  vatInfo?: {
    companyName: string;
    taxCode: string;
    email: string;
    remark: string;
  } | null;
}