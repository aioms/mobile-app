import React from "react";
import { IonIcon } from "@ionic/react";
import {
  analyticsOutline,
  arrowForwardOutline,
  cashOutline,
  receiptOutline,
  swapHorizontalOutline,
} from "ionicons/icons";

import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";

import { OverviewReport, ReportRange } from "../types";
import { reportOptions } from "../utils";

type DetailSource = "orders" | "receipts";

interface Props {
  reportRange: ReportRange;
  overview: OverviewReport;
  detailSource: DetailSource;
  onChangeRange: (range: ReportRange) => void;
  onChangeDetailSource: (source: DetailSource) => void;
}

const OverviewCard: React.FC<Props> = ({
  reportRange,
  overview,
  detailSource,
  onChangeRange,
  onChangeDetailSource,
}) => {
  const activeBreakdown =
    detailSource === "orders" ? overview.orders : overview.receipts;

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f8fafc_100%)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Báo cáo tổng quan
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">
              Tổng quan doanh thu, chi phí và lợi nhuận
            </h3>
          </div>
          <div className="rounded-2xl bg-white/80 p-3 text-slate-300">
            <IonIcon icon={analyticsOutline} className="text-4xl" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-white p-1 shadow-sm">
          {reportOptions.map((option) => {
            const isActive = option.key === reportRange;

            return (
              <button
                key={option.key}
                type="button"
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-500"
                }`}
                onClick={() => onChangeRange(option.key)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        <div className="rounded-[24px] border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Tổng doanh thu
              </p>
              <div className="mt-2 text-[32px] font-bold leading-none text-slate-900">
                {formatCurrencyWithoutSymbol(overview.revenue)}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-slate-300">
              <IonIcon icon={arrowForwardOutline} className="text-3xl" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`rounded-2xl border p-3 text-left transition ${
                detailSource === "orders"
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-slate-50"
              }`}
              onClick={() => onChangeDetailSource("orders")}
            >
              <div className="text-xs font-semibold text-slate-500">
                Đơn hàng ({overview.orders.count})
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900">
                {formatCurrencyWithoutSymbol(overview.orders.total)}
              </div>
              <div className="mt-1 text-xs font-medium text-blue-600">
                Chạm để xem CK và tiền mặt
              </div>
            </button>

            <button
              type="button"
              className={`rounded-2xl border p-3 text-left transition ${
                detailSource === "receipts"
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-slate-50"
              }`}
              onClick={() => onChangeDetailSource("receipts")}
            >
              <div className="text-xs font-semibold text-slate-500">
                Phiếu thu ({overview.receipts.count})
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900">
                {formatCurrencyWithoutSymbol(overview.receipts.total)}
              </div>
              <div className="mt-1 text-xs font-medium text-blue-600">
                Chạm để xem CK và tiền mặt
              </div>
            </button>
          </div>

          <div className="mt-3 rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <IonIcon icon={swapHorizontalOutline} />
              {detailSource === "orders" ? "Chi tiết đơn hàng" : "Chi tiết phiếu thu"}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Chuyển khoản
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  {formatCurrencyWithoutSymbol(activeBreakdown.bank)}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Tiền mặt
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900">
                  {formatCurrencyWithoutSymbol(activeBreakdown.cash)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-[24px] border border-rose-100 bg-rose-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-rose-600">
              <IonIcon icon={receiptOutline} />
              Chi phí {reportRange === "day" ? "ngày" : ""}
            </div>
            <div className="mt-3 text-[28px] font-bold leading-none text-rose-500">
              {formatCurrencyWithoutSymbol(overview.expense)}
            </div>
          </div>

          <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-blue-600">
              <IonIcon icon={cashOutline} />
              Lợi nhuận {reportRange === "day" ? "ngày" : ""}
            </div>
            <div className="mt-3 text-[28px] font-bold leading-none text-blue-600">
              {formatCurrencyWithoutSymbol(overview.profit)}
            </div>
            <div className="mt-4 border-t border-blue-100 pt-3 text-sm text-emerald-600">
              Tỉ lệ tăng trưởng: +{overview.growthRate}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewCard;
