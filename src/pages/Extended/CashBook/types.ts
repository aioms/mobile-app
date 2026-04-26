import type {
  CashbookBalanceStatus,
  CashbookDailyBalanceQueryDto,
  CashbookDailyBalanceResponseDto,
  CashbookExpenseItemDto,
  CashbookOverviewQueryDto,
  CashbookOverviewResponseDto,
  CashbookReportRange,
  CashbookRevenueSummaryDto,
  UpdateCashbookActualCashRequestDto,
  UpdateCashbookActualCashResponseDto,
} from "@/types/cashbook.type";

export type ReportRange = CashbookReportRange;
export type RevenueBreakdown = CashbookRevenueSummaryDto;
export type OverviewReport = CashbookOverviewResponseDto;
export type ExpenseItem = CashbookExpenseItemDto;
export type DailyCashBook = CashbookDailyBalanceResponseDto;
export type BalanceStatus = CashbookBalanceStatus;

export type {
  CashbookDailyBalanceQueryDto,
  CashbookOverviewQueryDto,
  UpdateCashbookActualCashRequestDto,
  UpdateCashbookActualCashResponseDto,
};

export type DetailSource = "orders" | "receipts";

export interface BalanceState {
  label: string;
  helper: string;
  badgeClass: string;
  valueClass: string;
}
