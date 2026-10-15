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
  embedded?: boolean;
}

const DailyPaymentSummaryCards: React.FC<Props> = ({ source, embedded = false }) => {
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
    if (embedded) {
      return (
        <div className="grid grid-cols-2 gap-4 pt-2.5 mt-2.5 border-t border-gray-100 animate-pulse">
          <div>
            <div className="h-3 w-24 rounded bg-gray-100 mb-1.5" />
            <div className="h-6 w-20 rounded bg-gray-100" />
          </div>
          <div className="pl-4 border-l border-gray-100">
            <div className="h-3 w-20 rounded bg-gray-100 mb-1.5" />
            <div className="h-6 w-20 rounded bg-gray-100" />
          </div>
        </div>
      );
    }

    return (
      <AppCard noPadding className="mx-4 mb-2 animate-pulse">
        <div className="grid grid-cols-2 divide-x divide-gray-100 px-4 py-3">
          <div className="pr-3">
            <div className="h-3 w-24 rounded bg-gray-100 mb-2" />
            <div className="h-6 w-28 rounded bg-gray-100" />
          </div>
          <div className="pl-3">
            <div className="h-3 w-20 rounded bg-gray-100 mb-2" />
            <div className="h-6 w-28 rounded bg-gray-100" />
          </div>
        </div>
      </AppCard>
    );
  }

  if (error) {
    if (embedded) {
      return (
        <div className="flex items-center justify-between gap-3 pt-2.5 mt-2.5 border-t border-gray-100">
          <p className="truncate text-xs text-red-600">{error}</p>
          <button
            type="button"
            className="text-xs font-semibold text-blue-600 shrink-0"
            onClick={loadSummary}
          >
            Thử lại
          </button>
        </div>
      );
    }

    return (
      <AppCard noPadding className="mx-4 mb-2">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="truncate text-xs text-red-600">{error}</p>
          <button
            type="button"
            className="text-xs font-semibold text-blue-600 shrink-0"
            onClick={loadSummary}
          >
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

  const formattedBank = formatCurrencyWithoutSymbol(data.bank);
  const formattedCash = formatCurrencyWithoutSymbol(data.cash);

  const content = (
    <div className="grid grid-cols-2 gap-4">
      {/* Chuyển khoản */}
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-gray-500 mb-1 truncate">
          Chuyển khoản hôm nay
        </span>
        <span
          className={`font-bold text-gray-900 truncate tabular-nums ${
            data.bank >= 100_000_000 ? "text-sm sm:text-base" : "text-base sm:text-lg"
          }`}
          title={`Chuyển khoản hôm nay: ${formattedBank} đ`}
        >
          {formattedBank} đ
        </span>
      </div>

      {/* Tiền mặt */}
      <div className="flex flex-col pl-4 border-l border-gray-100 min-w-0">
        <span className="text-xs text-gray-500 mb-1 truncate">
          Tiền mặt hôm nay
        </span>
        <span
          className={`font-bold text-gray-900 truncate tabular-nums ${
            data.cash >= 100_000_000 ? "text-sm sm:text-base" : "text-base sm:text-lg"
          }`}
          title={`Tiền mặt hôm nay: ${formattedCash} đ`}
        >
          {formattedCash} đ
        </span>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="pt-2.5 mt-2.5 border-t border-gray-100">
        {content}
      </div>
    );
  }

  return (
    <AppCard noPadding className="mx-4 mb-2">
      <div className="px-4 py-3">
        {content}
      </div>
    </AppCard>
  );
};

export default DailyPaymentSummaryCards;
