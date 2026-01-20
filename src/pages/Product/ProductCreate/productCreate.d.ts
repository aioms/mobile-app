export interface ProductImage {
  id: string;
  path: string;
}

export interface IProductCreateForm {
  name: string;
  categoryId: string;
  supplierId: string;
  costPrice: string;
  salePrice: string;
  inventory: string;
  unit: string;
  description: string;
  notes: string;
  images: ProductImage[];
}

export interface IProductCreateFormErrors {
  name?: string;
  categoryId?: string;
  supplierId?: string;
  costPrice?: string;
  salePrice?: string;
  inventory?: string;
  unit?: string;
  description?: string;
  notes?: string;
}

export interface ISupplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
}

export interface IProductCreatePayload {
  productName: string;
  category: string;
  suppliers: Array<{
    id: string;
    costPrice: number;
  }>;
  costPrice: number;
  sellingPrice: number;
  inventory: number;
  unit: string;
  description?: string;
  note?: string;
  status: string;
  images?: string[]; // Array of file IDs
}
