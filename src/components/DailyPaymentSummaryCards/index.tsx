import React, { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";

import { AppCard } from "@/components/UI";
import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";
import useCashbook from "@/hooks/apis/useCashbook";
import type {
  CashbookDailyRevenueSummaryResponseDto,
  CashbookRevenueSummaryDto,
} from "@/types/cashbook.type";

type RevenueSource = "orders" | "receipts";

interface Props {
  source: RevenueSource;
}

const DailyPaymentSummaryCards: React.FC<Props> = ({ source }) => {
  const { getDailyRevenueSummary } = useCashbook();
  const [summary, setSummary] = useState<CashbookDailyRevenueSummaryResponseDto | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getDailyRevenueSummary(dayjs().format("YYYY-MM-DD"));
      setSummary(result);
    } catch (loadError) {
      setError((loadError as Error).message || "Không thể tải tổng thu trong ngày");
    } finally {
      setIsLoading(false);
    }
  }, [getDailyRevenueSummary]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (isLoading) {
    return (
      <AppCard className="mx-4 mb-3 animate-pulse">
        <div className="h-4 w-40 rounded bg-gray-100" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="h-16 rounded-xl bg-gray-100" />
          <div className="h-16 rounded-xl bg-gray-100" />
        </div>
      </AppCard>
    );
  }

  if (error) {
    return (
      <AppCard className="mx-4 mb-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" className="text-sm font-semibold text-blue-600" onClick={loadSummary}>
            Thử lại
          </button>
        </div>
      </AppCard>
    );
  }

  const data: CashbookRevenueSummaryDto = summary?.[source] ?? {
    count: 0,
    total: 0,
    cash: 0,
    bank: 0,
  };
  const title = source === "orders" ? "Đơn hàng" : "Phiếu thu";

  return (
    <AppCard className="mx-4 mb-3">
      <h3 className="text-sm font-semibold text-slate-700">Thu {title.toLowerCase()} hôm nay</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Chuyển khoản</p>
          <p className="mt-1 whitespace-nowrap text-base font-bold tracking-tight text-slate-900">
            {formatCurrencyWithoutSymbol(data.bank)} đ
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Tiền mặt</p>
          <p className="mt-1 whitespace-nowrap text-base font-bold tracking-tight text-slate-900">
            {formatCurrencyWithoutSymbol(data.cash)} đ
          </p>
        </div>
      </div>
    </AppCard>
  );
};

export default DailyPaymentSummaryCards;
