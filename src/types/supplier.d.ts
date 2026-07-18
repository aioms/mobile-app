export interface ISupplier {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  taxCode?: string;
  address?: string;
  note?: string;
  totalDebt?: number;
  totalPurchased?: number;
  status: string | number;
  createdAt?: string;
  updatedAt?: string;
  type?: string;
  lastTransactionDate?: string;
}

export interface ISupplierListItem extends ISupplier {
  lastTransactionDate?: string;
}

export interface ISupplierDetail extends ISupplier {
  totalReceiptReturn?: number;
}
