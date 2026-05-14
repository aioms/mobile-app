import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";

import {
  BalanceStatus,
  BalanceState,
  DailyCashBook,
  OverviewReport,
  ReportRange,
} from "./types";

export const reportOptions: Array<{ key: ReportRange; label: string }> = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
  { key: "year", label: "Năm" },
];

export const getEmptyOverview = (
  range: ReportRange,
  date: string,
): OverviewReport => ({
  range,
  date,
  startDate: date,
  endDate: date,
  timezone: "Asia/Ho_Chi_Minh",
  revenue: 0,
  expense: 0,
  profit: 0,
  growthRate: 0,
  orders: {
    total: 0,
    cash: 0,
    bank: 0,
    count: 0,
  },
  receipts: {
    total: 0,
    cash: 0,
    bank: 0,
    count: 0,
  },
});

export const getEmptyDailyCashBook = (selectedDate: string): DailyCashBook => ({
  date: selectedDate,
  timezone: "Asia/Ho_Chi_Minh",
  orderCash: 0,
  receiptCash: 0,
  cashRevenue: 0,
  cashForDay: 0,
  hasCashForDay: false,
  expenseItems: [],
  totalExpense: 0,
  returnsCash: 0,
  previousActualCash: 0,
  previousActualCashDate: null,
  computedCash: 0,
  actualCash: null,
  hasActualCash: false,
  difference: null,
  balanceStatus: null,
});

export const getSelectedCashBook = (selectedDate: string) =>
  getEmptyDailyCashBook(selectedDate);

export const getPreviousActualCash = (cashbook: DailyCashBook) =>
  cashbook.previousActualCash || 0;

export const getTotalExpense = (cashbook: DailyCashBook) =>
  cashbook.totalExpense || 0;

export const formatActualCashInputValue = (actualCash: number | null) => {
  if (actualCash === null) {
    return "";
  }

  return formatCurrencyWithoutSymbol(actualCash);
};

export const formatCashForDayInputValue = (
  cashForDay: number,
  hasCashForDay: boolean,
) => {
  if (!hasCashForDay) {
    return "";
  }

  return formatCurrencyWithoutSymbol(cashForDay);
};

export const getBalanceState = (
  balanceStatus: BalanceStatus,
  difference: number | null,
): BalanceState => {
  if (balanceStatus === null) {
    return {
      label: "Chưa đối chiếu",
      helper: "Nhập thực tế tiền mặt để kiểm tra chênh lệch.",
      badgeClass: "border-slate-200 bg-slate-50 text-slate-600",
      valueClass: "border-slate-200 text-slate-900",
    };
  }

  if (balanceStatus === "MATCHED") {
    return {
      label: "Đã cân đối",
      helper: "Tồn mới khớp với thực tế tiền mặt.",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      valueClass: "border-emerald-300 text-emerald-600",
    };
  }

  const formattedDifference = formatCurrencyWithoutSymbol(Math.abs(difference || 0));

  if (balanceStatus === "SHORTAGE") {
    return {
      label: `Thiếu: ${formattedDifference}`,
      helper: "Thực tế nhỏ hơn tồn mới dự tính.",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      valueClass: "border-rose-300 text-rose-600 bg-rose-50",
    };
  }

  return {
    label: `Dư: ${formattedDifference}`,
    helper: "Thực tế lớn hơn tồn mới dự tính.",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    valueClass: "border-amber-300 text-amber-600 bg-amber-50",
  };
};
