export interface ReceiptImportItemList {
  id: string;
  receiptNumber: string;
  importDate: string;
  quantity: number;
  status: string;
  warehouse: string;
  note: string;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
  };
  user: {
    id: string,
    code: string,
    username: string,
    fullname: string,
  },
  items?: Array<{
    receiptId: string;
    id: string;
    code: string;
    productId: string;
    productCode: number;
    productName: string;
    quantity: number;
    costPrice: number;
    discount: number;
  }>;
}