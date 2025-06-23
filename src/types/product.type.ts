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
  suppliers: Array<{
    id: string;
    name: string;
    costPrice: number;
  }>;
}
