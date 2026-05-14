import React from "react";
import { IonIcon } from "@ionic/react";
import {
  checkmarkCircle,
  createOutline,
} from "ionicons/icons";

import DatePicker from "@/components/DatePicker";
import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";

import { BalanceState, DailyCashBook } from "../types";

interface Props {
  selectedDate: string;
  selectedCashBook: DailyCashBook;
  returnsCash: number;
  previousActualCash: number;
  cashRevenue: number;
  computedCash: number;
  cashForDayInput: string;
  actualCashInput: string;
  balanceState: BalanceState;
  isInputDisabled?: boolean;
  onDateChange: (date: string) => void;
  onCashForDayChange: (value: string) => void;
  onCashForDayBlur: () => void;
  onActualCashChange: (value: string) => void;
  onActualCashBlur: () => void;
}

const baseInputStyles =
  "w-full rounded-2xl border bg-slate-50 px-4 py-3 text-right text-lg font-semibold outline-none transition";

const CashBalanceCard: React.FC<Props> = ({
  selectedDate,
  selectedCashBook,
  returnsCash,
  previousActualCash,
  cashRevenue,
  computedCash,
  cashForDayInput,
  actualCashInput,
  balanceState,
  isInputDisabled = false,
  onDateChange,
  onCashForDayChange,
  onCashForDayBlur,
  onActualCashChange,
  onActualCashBlur,
}) => {
  const totalCashExpenditure =
    (selectedCashBook.totalExpense || 0) + (returnsCash || 0);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_40%,#eef2ff_100%)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Quỹ tiền mặt tại quầy
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">
              Chi tiết tồn tiền mặt theo ngày
            </h3>
          </div>

          <DatePicker
            value={selectedDate}
            presentation="date"
            onChange={(event) => {
              const rawValue = event.detail.value as string | null;
              if (!rawValue) {
                return;
              }

              onDateChange(rawValue.split("T")[0]);
            }}
            attrs={{ id: "cashbook-date-filter", locale: "en-GB" }}
            formatOptions={{
              date: {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              },
            }}
            extraClassName="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="grid gap-4 rounded-[24px] border border-slate-200 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Thu tiền mặt
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Bán hàng tiền mặt</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrencyWithoutSymbol(selectedCashBook.orderCash)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phiếu thu tiền mặt</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrencyWithoutSymbol(selectedCashBook.receiptCash)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Chi trong ngày
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {selectedCashBook.expenseItems.length > 0 || returnsCash > 0 ? (
                  <>
                    {selectedCashBook.expenseItems.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between"
                      >
                        <span>{expense.label}</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrencyWithoutSymbol(expense.amount)}
                        </span>
                      </div>
                    ))}
                    <div
                      className="flex items-center justify-between"
                    >
                      <span>Trả hàng tiền mặt</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrencyWithoutSymbol(returnsCash)}
                      </span>
                    </div>
                    <div className="mt-2 border-t border-slate-200 pt-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">
                        Tổng chi tiền mặt
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrencyWithoutSymbol(totalCashExpenditure)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
                    Chưa có phiếu chi trong ngày.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Tiền mặt ngày
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Nhập tay tiền mặt ngày để tính tồn mới.
                </p>
              </div>
              <IonIcon icon={createOutline} className="text-lg text-slate-400" />
            </div>

            <div className="mt-3">
              <input
                inputMode="numeric"
                value={cashForDayInput}
                onChange={(event) => onCashForDayChange(event.target.value)}
                onBlur={onCashForDayBlur}
                disabled={isInputDisabled}
                placeholder="Nhập số tiền"
                className={`${baseInputStyles} border-slate-200 text-slate-900`}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.12)]">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Doanh thu tiền mặt
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">
                {formatCurrencyWithoutSymbol(cashRevenue)}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.12)]">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Tồn cũ
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">
                {formatCurrencyWithoutSymbol(previousActualCash)}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Lấy theo thực tế tiền mặt của ngày trước đó.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
                Tồn mới dự tính
              </div>
              <div className="mt-3 text-2xl font-bold text-blue-600">
                {formatCurrencyWithoutSymbol(computedCash)}
              </div>
              <p className="mt-2 text-xs text-blue-500">
                = Tiền mặt ngày + Doanh thu tiền mặt + Tồn cũ - Chi - Trả hàng
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Thực tế tiền mặt
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Nhập tay để đối chiếu cuối ngày.
                </p>
              </div>
              <IonIcon icon={createOutline} className="text-lg text-slate-400" />
            </div>

            <div className="mt-3">
              <input
                inputMode="numeric"
                value={actualCashInput}
                onChange={(event) => onActualCashChange(event.target.value)}
                onBlur={onActualCashBlur}
                disabled={isInputDisabled}
                placeholder="Nhập số tiền"
                className={`${baseInputStyles} ${balanceState.valueClass}`}
              />
            </div>
          </div>

          <div className={`rounded-2xl border px-4 py-3 ${balanceState.badgeClass}`}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <IonIcon icon={checkmarkCircle} className="text-base" />
              {balanceState.label}
            </div>
            <div className="mt-1 text-sm opacity-90">{balanceState.helper}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashBalanceCard;
