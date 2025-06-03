export interface IOrderItem {
  productId: string;
  productName: string;
  code: string;
  quantity: number;
  price: number;
}

export interface IVatInfo {
  companyName: string;
  taxCode: string;
  email: string;
  remark: string;
}

export interface IOrder {
  id: string;
  code: string;
  customerType: string;
  paymentMethod: string;
  totalAmount: number;
  discountAmount: number;
  status: string;
  note: string;
  vatInfo: IVatInfo;
  items: IOrderItem[];
  createdAt: string;
}