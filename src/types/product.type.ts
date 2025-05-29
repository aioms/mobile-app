export interface IProduct {
  id: string;
  code: string;
  productCode: string;
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
