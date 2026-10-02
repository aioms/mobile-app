import React from "react";
import { IonIcon } from "@ionic/react";
import {
  arrowUndoOutline,
  calendarOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  receiptOutline,
  swapHorizontalOutline,
} from "ionicons/icons";

import { dayjsFormat, formatCurrency } from "@/helpers/formatters";
import { ReceiptReturnHistoryEntry, ReceiptReturnStatus } from "@/types/receipt-return.type";

interface Props {
  entries: ReceiptReturnHistoryEntry[];
  onStatusChange?: (id: string, status: ReceiptReturnStatus) => void;
  isLoading?: boolean;
  className?: string;
}

const statusConfig: Record<
  ReceiptReturnStatus,
  { label: string; cls: string }
> = {
  [ReceiptReturnStatus.COMPLETED]: {
    label: "Đã hoàn tất",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  [ReceiptReturnStatus.PROCESSING]: {
    label: "Đang xử lý",
    cls: "bg-amber-50 text-amber-700 border-amber-100",
  },
  [ReceiptReturnStatus.DRAFT]: {
    label: "Nháp",
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  },
  [ReceiptReturnStatus.CANCELLED]: {
    label: "Đã hủy",
    cls: "bg-red-50 text-red-600 border-red-100",
  },
};

const ReturnExchangeHistory: React.FC<Props> = ({
  entries,
  onStatusChange,
  isLoading,
  className = "",
}) => {
  if (!entries || entries.length === 0) return null;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <IonIcon icon={receiptOutline} className="text-base" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Lịch sử trả/đổi hàng</h3>
        </div>
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {entries.length} lần
        </span>
      </div>

      {/* Entry List */}
      <div className="divide-y divide-gray-100">
        {entries.map((entry) => {
          const isExchange = entry.operationType === "exchange";
          const exchangeItems = entry.exchangeItems || [];
          const status = entry.status || ReceiptReturnStatus.COMPLETED;
          const currentStatusConfig =
            statusConfig[status] || statusConfig[ReceiptReturnStatus.COMPLETED];

          return (
            <div key={entry.id} className="p-3.5 space-y-2.5">
              {/* Row 1: Code, Date & Badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-gray-900 break-all leading-tight">
                    #{entry.receiptNumber}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                    <IonIcon icon={calendarOutline} className="text-xs shrink-0" />
                    <span>
                      {entry.returnDate
                        ? dayjsFormat(entry.returnDate, "DD/MM/YYYY")
                        : "Không rõ ngày"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {/* Type Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      isExchange
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-orange-50 text-orange-700 border-orange-100"
                    }`}
                  >
                    <IonIcon
                      icon={isExchange ? swapHorizontalOutline : arrowUndoOutline}
                      className="text-xs"
                    />
                    {isExchange ? "Đổi hàng" : "Trả hàng"}
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${currentStatusConfig.cls}`}
                  >
                    {currentStatusConfig.label}
                  </span>
                </div>
              </div>

              {/* Row 2: Exchange products / Return indicator */}
              {isExchange && exchangeItems.length > 0 && (
                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <div className="text-[11px] font-medium text-gray-500 mb-1 flex items-center justify-between">
                    <span>Sản phẩm nhận đổi</span>
                    <span className="text-gray-400 font-normal">
                      {exchangeItems.length} SP
                    </span>
                  </div>
                  <div className="space-y-1">
                    {exchangeItems.map((item, idx) => (
                      <div
                        key={`${entry.id}-${item.productName}-${idx}`}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-gray-800 font-medium truncate">
                          {item.productName}
                        </span>
                        <span className="text-gray-500 font-semibold shrink-0">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isExchange && status === ReceiptReturnStatus.COMPLETED && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50/60 border border-orange-100/60 text-xs text-orange-800">
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    className="text-sm text-orange-600 shrink-0"
                  />
                  <span>Sản phẩm đã được ghi nhận nhập lại kho</span>
                </div>
              )}

              {/* Row 3: Financial Summary */}
              {entry.accountingVersion === 3 && (
                <div className="pt-2 border-t border-dashed border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-500">Hàng trả:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(entry.originalReturnAmount || 0)}
                      </span>
                    </div>

                    {isExchange && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">Hàng nhận (VAT):</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(entry.replacementAmount || 0)}
                        </span>
                      </div>
                    )}

                    {entry.differenceAmount !== undefined &&
                      entry.differenceAmount !== 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Chênh lệch:</span>
                          <span
                            className={`font-semibold ${
                              entry.differenceAmount > 0
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {entry.differenceAmount > 0 ? "+" : ""}
                            {formatCurrency(entry.differenceAmount)}
                          </span>
                        </div>
                      )}
                  </div>

                  <p className="text-[11px] text-gray-400 mt-1 italic">
                    Không tự thu thêm hoặc hoàn tiền
                  </p>
                </div>
              )}

              {/* Row 4: Action Buttons (for pending returns) */}
              {onStatusChange &&
                entry.accountingVersion === 3 &&
                !isExchange &&
                status !== ReceiptReturnStatus.CANCELLED && (
                  <div className="flex gap-2 pt-1">
                    {status !== ReceiptReturnStatus.COMPLETED && (
                      <button
                        type="button"
                        className="flex-1 min-h-[44px] px-3 rounded-xl bg-blue-50 active:bg-blue-100 text-blue-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-100"
                        disabled={isLoading}
                        onClick={() =>
                          onStatusChange(entry.id, ReceiptReturnStatus.COMPLETED)
                        }
                      >
                        <IonIcon
                          icon={checkmarkCircleOutline}
                          className="text-sm shrink-0"
                        />
                        <span>Xác nhận trả</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex-1 min-h-[44px] px-3 rounded-xl bg-red-50 active:bg-red-100 text-red-600 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-red-100"
                      disabled={isLoading}
                      onClick={() =>
                        onStatusChange(entry.id, ReceiptReturnStatus.CANCELLED)
                      }
                    >
                      <IonIcon
                        icon={closeCircleOutline}
                        className="text-sm shrink-0"
                      />
                      <span>Hủy phiếu trả</span>
                    </button>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReturnExchangeHistory;
