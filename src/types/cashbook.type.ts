export type CashbookReportRange = "day" | "week" | "month" | "year";

export type CashbookBalanceStatus = "MATCHED" | "SHORTAGE" | "EXCESS" | null;

export interface CashbookRevenueSummaryDto {
  count: number;
  total: number;
  cash: number;
  bank: number;
}

export interface CashbookOverviewQueryDto {
  range: CashbookReportRange;
  date: string;
}

export interface CashbookOverviewResponseDto {
  range: CashbookReportRange;
  date: string;
  startDate: string;
  endDate: string;
  timezone: string;
  revenue: number;
  expense: number;
  profit: number;
  growthRate: number;
  orders: CashbookRevenueSummaryDto;
  receipts: CashbookRevenueSummaryDto;
}

export interface CashbookExpenseItemDto {
  id: string;
  label: string;
  amount: number;
}

export interface CashbookDailyBalanceQueryDto {
  date: string;
}

export interface CashbookDailyBalanceResponseDto {
  date: string;
  timezone: string;
  orderCash: number;
  receiptCash: number;
  cashRevenue: number;
  cashForDay: number;
  hasCashForDay: boolean;
  expenseItems: CashbookExpenseItemDto[];
  totalExpense: number;
  returnsCash: number;
  previousActualCash: number;
  previousActualCashDate: string | null;
  computedCash: number;
  actualCash: number | null;
  hasActualCash: boolean;
  difference: number | null;
  balanceStatus: CashbookBalanceStatus;
}

export interface UpdateCashbookActualCashRequestDto {
  date: string;
  actualCash: number;
}

export interface UpdateCashbookActualCashResponseDto {
  date: string;
  timezone: string;
  cashForDay: number;
  hasCashForDay: boolean;
  actualCash: number | null;
  computedCash: number;
  hasActualCash: boolean;
  difference: number | null;
  balanceStatus: CashbookBalanceStatus;
}

export interface UpdateCashbookCashForDayRequestDto {
  date: string;
  cashForDay: number;
}

export interface UpdateCashbookCashForDayResponseDto {
  date: string;
  timezone: string;
  cashForDay: number;
  hasCashForDay: boolean;
  actualCash: number | null;
  computedCash: number;
  hasActualCash: boolean;
  difference: number | null;
  balanceStatus: CashbookBalanceStatus;
}
