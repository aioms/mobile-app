export interface IProduct {
  id: string;
  code: string;
  productCode: number;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  status: string;
  category: string;
  inventory: number;
  unit: string;
  description: string;
  imageUrls?: string[]; // TODO: remove this property
  images?: Array<{
    id: string;
    path: string;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
    costPrice: number;
  }>;
}

export interface IProductItem {
  id: string;
  code: string;
  receiptId: string;
  productId: string;
  productName: string;
  productCode: number;
  actualInventory?: string;
  inventory?: string;
  quantity: number;
  returnedQuantity?: number;
  costPrice: number;
  discount?: number;
  createdAt: string;
  periodId?: string;
  originalQuantity?: number;
}
