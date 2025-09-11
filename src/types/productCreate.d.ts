export interface IProductCreateForm {
  productName: string;
  category: string;
  supplier: string;
  costPrice: string;
  sellingPrice: string;
  inventory: string;
  unit: string;
  description?: string;
  notes?: string;
}

export interface IProductCreateFormErrors {
  productName?: string;
  category?: string;
  supplier?: string;
  costPrice?: string;
  sellingPrice?: string;
  inventory?: string;
  unit?: string;
}

export interface ISupplier {
  id: string;
  name: string;
  costPrice?: number;
}

export interface IProductCreatePayload {
  productName: string;
  categoryId: string;
  supplierId: string;
  costPrice: number;
  sellingPrice: number;
  inventory: number;
  unit: string;
  description?: string;
  notes?: string;
}