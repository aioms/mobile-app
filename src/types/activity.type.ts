export enum UserActivityType {
  ORDER_COMPLETED = "order_completed",
  PRODUCT_COST_PRICE_CHANGE = "product_cost_price_change",
  PRODUCT_SELLING_PRICE_CHANGE = "product_selling_price_change",
  RECEIPT_IMPORT_CREATED = "receipt_import_created",
  RECEIPT_IMPORT_CANCELLED = "receipt_import_cancelled",
  RECEIPT_IMPORT_COMPLETED = "receipt_import_completed",
  RECEIPT_CHECK_CREATED = "receipt_check_created",
  RECEIPT_CHECK_BALANCED = "receipt_check_balanced",
  RECEIPT_DEBT_CREATED = "receipt_debt_created",
  RECEIPT_DEBT_UPDATED = "receipt_debt_updated",
  RECEIPT_DEBT_PAID = "receipt_debt_paid",
  RECEIPT_DEBT_DELETED = "receipt_debt_deleted",
  RECEIPT_PAYMENT_CREATED = "receipt_payment_created",
  RECEIPT_PAYMENT_UPDATED = "receipt_payment_updated",
  RECEIPT_PAYMENT_DELETED = "receipt_payment_deleted",
  RECEIPT_RETURN_CREATED = "receipt_return_created",
  RECEIPT_RETURN_COMPLETED = "receipt_return_completed",
  CASHBOOK_CASH_FOR_DAY_UPDATED = "cashbook_cash_for_day_updated",
  CASHBOOK_ACTUAL_CASH_UPDATED = "cashbook_actual_cash_updated",
}

export interface RecentActivityItemDto {
  id: string;
  type: UserActivityType | string;
  description: string;
  referenceId?: string | null;
  username: string;
  fullname: string;
  createdAt: string;
}

export interface PaginationMetadataDto {
  offset: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface GetRecentActivitiesResponseDto {
  data: RecentActivityItemDto[];
  metadata: PaginationMetadataDto;
  success: boolean;
  statusCode: number;
}

export interface GetRecentActivitiesQueryDto {
  page?: number;
  limit?: number;
}
