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
      <AppCard noPadding className="mx-4 mb-3 animate-pulse">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <div className="h-3 w-12 rounded bg-gray-100" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-8 w-20 rounded bg-gray-100" />
            <div className="h-8 w-16 rounded bg-gray-100" />
          </div>
        </div>
      </AppCard>
    );
  }

  if (error) {
    return (
      <AppCard noPadding className="mx-4 mb-3">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
          <p className="truncate text-xs text-red-600">{error}</p>
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
  return (
    <AppCard noPadding className="mx-4 mb-3 rounded-xl">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="shrink-0 text-xs font-medium text-gray-500">Hôm nay</span>
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="px-2 text-right">
            <p className="text-[10px] font-medium text-gray-500">Chuyển khoản</p>
            <p className="whitespace-nowrap text-sm font-semibold text-gray-900">
              {formatCurrencyWithoutSymbol(data.bank)} đ
            </p>
          </div>
          <div className="px-2 text-right">
            <p className="text-[10px] font-medium text-gray-500">Tiền mặt</p>
            <p className="whitespace-nowrap text-sm font-semibold text-gray-900">
              {formatCurrencyWithoutSymbol(data.cash)} đ
            </p>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default DailyPaymentSummaryCards;
