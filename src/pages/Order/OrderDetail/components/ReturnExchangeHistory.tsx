import React from "react";
import { IonIcon } from "@ionic/react";
import {
  arrowUndoOutline,
  calendarOutline,
  receiptOutline,
  swapHorizontalOutline,
} from "ionicons/icons";

import { dayjsFormat } from "@/helpers/formatters";
import { IOrder } from "@/types/order.type";

type HistoryEntry = NonNullable<IOrder["returnHistory"]>[number];

interface Props {
  entries: HistoryEntry[];
}

const ReturnExchangeHistory: React.FC<Props> = ({ entries }) => {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <IonIcon icon={receiptOutline} className="text-lg" />
        </div>
        <div>
          <h2 className="font-medium text-foreground">Lịch sử trả/đổi hàng</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {entries.length} lần phát sinh
          </p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {entries.map((entry) => {
          const isExchange = entry.operationType === "exchange";
          const exchangeItems = entry.exchangeItems || [];

          return (
            <div key={entry.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isExchange ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                }`}>
                  <IonIcon icon={isExchange ? swapHorizontalOutline : arrowUndoOutline} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm text-foreground break-all">
                        #{entry.receiptNumber}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <IonIcon icon={calendarOutline} />
                        {entry.returnDate ? dayjsFormat(entry.returnDate, "DD/MM/YYYY") : "Không rõ ngày"}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      isExchange
                        ? "bg-blue-50 text-blue-700"
                        : "bg-orange-50 text-orange-700"
                    }`}>
                      {isExchange ? "Đổi sản phẩm" : "Trả hàng"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-1 ${
                      isExchange
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    }`}>
                      {isExchange ? "SP đổi" : "Sản phẩm trả"}
                    </span>
                    <span className="text-muted-foreground">Đã hoàn tất</span>
                  </div>

                  {isExchange && exchangeItems.length > 0 && (
                    <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
                      <div className="text-xs font-medium text-gray-600 mb-2">Sản phẩm đổi</div>
                      <div className="space-y-2">
                        {exchangeItems.map((item) => (
                          <div key={`${entry.id}-${item.productName}`} className="flex items-start justify-between gap-3 text-sm">
                            <span className="text-gray-700 min-w-0 break-words">
                              {item.productName}
                            </span>
                            <span className="text-gray-500 whitespace-nowrap">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isExchange && (
                    <div className="mt-3 rounded-lg bg-orange-50/60 px-3 py-2 text-xs text-orange-700">
                      Sản phẩm đã được ghi nhận trả lại kho
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReturnExchangeHistory;
