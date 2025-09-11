export interface IOrderItem {
  productId: string;
  productName: string;
  code: string;
  quantity: number;
  price: number;
  vatRate?: number;
}

export interface IVatInfo {
  companyName: string;
  taxCode: string;
  email: string;
  remark: string;
}

export interface ICustomer {
  id: string;
  name: string;
}

export interface IOrder {
  id: string;
  code: string;
  customer: ICustomer | null;
  paymentMethod: string;
  totalAmount: number;
  discountAmount: number;
  status: string;
  note: string;
  vatInfo: IVatInfo;
  items: IOrderItem[];
  createdAt: string;
}