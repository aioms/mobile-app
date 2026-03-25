// TODO: Move to common types
export interface ICustomer {
  id: string;
  code: number;
  customerCode: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company?: string;
  taxCode?: string;
  note?: string;
  status: number;
  type: number;
  totalDebt: number;
  totalOrder: number;
  totalReturn: number;
  totalPaid: number;
  createdAt: string;
  totalOrders?: number;
  totalAmountSpent?: number;
  isVip?: boolean;
  avatarUrl?: string;
}

export interface ICustomerFilters {
  keyword?: string;
  status?: number;
  type?: number;
  customerIds?: string[];
}
