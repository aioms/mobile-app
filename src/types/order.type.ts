import { DiscountType } from "@/common/enums";
import { OrderType } from "@/common/enums/order";

export interface IOrderItem {
  productId: string;
  productName: string;
  code: string;
  quantity: number;
  price: number;
  vatRate?: number;
  shipNow?: boolean;
  returnedQuantity?: number;
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
  discountType?: DiscountType;
  status: string;
  orderType?: OrderType;
  note: string;
  vatInfo: IVatInfo;
  items: IOrderItem[];
  createdAt: string;
  returnHistory?: Array<{
    id: string;
    receiptNumber: string;
    operationType: "return" | "exchange";
    originalReturnAmount: number;
    replacementAmount: number;
    differenceAmount: number;
    exchangeItems?: Array<{ productName: string; quantity: number; unitPrice: number }>;
    returnDate?: string;
  }>;
}
