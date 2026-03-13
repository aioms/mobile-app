export interface ICustomer {
  id: string;
  code: string;
  customerCode: string;
  name: string;
  totalOrders: number;
  totalAmountSpent: number;
  isVip?: boolean;
  avatarUrl?: string;
  status?: string | number;
  type?: string | number;
}

export interface IPaginationMetadata {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ICustomerApiResponse {
  data: ICustomer[];
  metadata: IPaginationMetadata;
  success: boolean;
  statusCode: number;
}

export interface ICustomerFilters {
  keyword?: string;
  status?: number;
  type?: number;
  customerIds?: string[];
}
