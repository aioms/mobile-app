import React from "react";
import { IonIcon } from "@ionic/react";
import {
  calendarOutline,
  scanOutline,
  trendingDownOutline,
  trendingUpOutline,
} from "ionicons/icons";
import { formatCurrency, dayjsFormat } from "@/helpers/formatters";
import "dayjs/locale/vi";

interface ReturnSummaryCardProps {
  totalCount: number;
  totalAmount: number;
  trendPercent?: number;
  selectedDate?: string;
  onDateClick?: () => void;
  onScanClick?: () => void;
  className?: string;
}

const ReturnSummaryCard: React.FC<ReturnSummaryCardProps> = ({
  totalCount,
  totalAmount,
  trendPercent = -4,
  selectedDate,
  onDateClick,
  onScanClick,
  className = "",
}) => {
  // Format current date e.g. "Chủ nhật, 27 tháng 9 2026"
  const dateObj = selectedDate ? new Date(selectedDate) : new Date();
  const rawDateString = dayjsFormat(dateObj, "dddd, DD [tháng] M YYYY", "vi");
  const capitalizedDateString = rawDateString
    ? rawDateString.charAt(0).toUpperCase() + rawDateString.slice(1)
    : "Hôm nay";

  const isTrendNegative = (trendPercent ?? 0) < 0;

  return (
    <div
      data-cy="return-summary-card"
      className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm ${className}`}
    >
      {/* Top Date row with Scan icon */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <button
          type="button"
          onClick={onDateClick}
          className="flex items-center gap-2 text-xs font-semibold text-gray-800 hover:text-blue-600 transition-colors"
        >
          <IonIcon
            icon={calendarOutline}
            className="text-gray-500 text-sm"
          />
          <span>{capitalizedDateString}</span>
        </button>

        {onScanClick && (
          <button
            type="button"
            onClick={onScanClick}
            aria-label="Quét mã vạch phiếu"
            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center active:scale-95 transition-transform"
          >
            <IonIcon icon={scanOutline} className="text-base" />
          </button>
        )}
      </div>

      {/* 2-Column Summary statistics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column: TỔNG PHIẾU TRẢ */}
        <div>
          <span className="block text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-1">
            Tổng phiếu trả
          </span>
          <div className="flex items-baseline gap-2">
            <span
              data-cy="return-summary-count"
              className="text-2xl font-extrabold text-gray-900 tracking-tight"
            >
              {totalCount}
            </span>

            {trendPercent !== undefined && trendPercent !== 0 && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                  isTrendNegative
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <IonIcon
                  icon={isTrendNegative ? trendingDownOutline : trendingUpOutline}
                  className="text-xs"
                />
                <span>{trendPercent > 0 ? `+${trendPercent}%` : `${trendPercent}%`}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Column: TỔNG GIÁ TRỊ HOÀN */}
        <div className="border-l border-gray-100 pl-4">
          <span className="block text-[11px] font-bold text-gray-500 tracking-wider uppercase mb-1">
            Tổng giá trị hoàn
          </span>
          <span
            data-cy="return-summary-amount"
            className="text-lg sm:text-xl font-extrabold text-blue-600 tracking-tight block truncate"
          >
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReturnSummaryCard;
