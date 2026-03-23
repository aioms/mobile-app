export interface ISupplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  lastTransactionDate?: string;
  totalDebt?: number;
  totalPurchased?: number;
  type?: string;
  status?: string | number;
}
