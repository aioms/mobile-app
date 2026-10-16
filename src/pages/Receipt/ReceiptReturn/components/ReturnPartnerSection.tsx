import React from "react";
import { IonIcon } from "@ionic/react";
import {
  personOutline,
  businessOutline,
  receiptOutline,
  closeCircleOutline,
  swapHorizontalOutline,
} from "ionicons/icons";
import { ReceiptReturnType } from "@/types/receipt-return.type";
import ErrorMessage from "@/components/ErrorMessage";

interface Props {
  type: ReceiptReturnType;
  isFixedRoute: boolean;
  isDebt: boolean;
  customerName: string;
  supplierName: string;
  selectedOrderCode: string;
  refId?: string;
  refType?: "order" | "debt";
  errorSupplier?: string;
  onTypeChange: (type: ReceiptReturnType) => void;
  onSelectOrder: () => void;
  onClearOrder: () => void;
  onSelectCustomer: () => void;
  onSelectSupplier: () => void;
}

const ReturnPartnerSection: React.FC<Props> = ({
  type,
  isFixedRoute,
  isDebt,
  customerName,
  supplierName,
  selectedOrderCode,
  refId,
  refType,
  errorSupplier,
  onTypeChange,
  onSelectOrder,
  onClearOrder,
  onSelectCustomer,
  onSelectSupplier,
}) => {
  const isCustomer = type === ReceiptReturnType.CUSTOMER;

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3.5 space-y-3">
      {/* Type Selector (Customer vs Supplier) - Only when not fixed from existing Order/Debt */}
      {!isFixedRoute && (
        <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            data-cy="return-type-customer"
            onClick={() => onTypeChange(ReceiptReturnType.CUSTOMER)}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md transition-all ${
              isCustomer
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <IonIcon icon={personOutline} className="text-sm" />
            <span>Khách hàng</span>
          </button>
          <button
            type="button"
            data-cy="return-type-supplier"
            onClick={() => onTypeChange(ReceiptReturnType.SUPPLIER)}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-md transition-all ${
              !isCustomer
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <IonIcon icon={businessOutline} className="text-sm" />
            <span>Nhà cung cấp</span>
          </button>
        </div>
      )}

      {/* Partner Details */}
      {isCustomer ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <IonIcon icon={personOutline} className="text-base" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-gray-400 block">Khách hàng</span>
                <span className="text-sm font-semibold text-gray-900 truncate block">
                  {customerName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {refId && (
                <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                  {refType === "debt" ? "Công nợ" : "Đơn hàng"}
                </span>
              )}
              {!isFixedRoute && (
                <button
                  type="button"
                  data-cy="return-select-customer-btn"
                  onClick={onSelectCustomer}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Chọn khách
                </button>
              )}
            </div>
          </div>

          {/* Optional Order Reference Card (for customer returns) */}
          {!isDebt && (
            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <IonIcon icon={receiptOutline} className="text-gray-400 text-base shrink-0" />
                {refId ? (
                  <div className="min-w-0">
                    <span className="text-gray-500 text-[11px] block">Đơn hàng tham chiếu</span>
                    <span className="font-bold text-gray-800 truncate block">
                      #{selectedOrderCode || refId.slice(0, 8)}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">
                    Chưa liên kết đơn hàng (tùy chọn)
                  </span>
                )}
              </div>

              {!isFixedRoute && (
                <div>
                  {refId ? (
                    <button
                      type="button"
                      data-cy="return-clear-order-btn"
                      onClick={onClearOrder}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 px-2 py-1 rounded"
                    >
                      <IonIcon icon={closeCircleOutline} className="text-sm" />
                      <span>Hủy đơn</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-cy="return-select-order-btn"
                      onClick={onSelectOrder}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded bg-white border border-gray-200 shadow-2xs"
                    >
                      <IonIcon icon={swapHorizontalOutline} className="text-sm" />
                      <span>Chọn đơn</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <IonIcon icon={businessOutline} className="text-base" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-gray-400 block">Nhà cung cấp</span>
                <span className="text-sm font-semibold text-gray-900 truncate block">
                  {supplierName}
                </span>
              </div>
            </div>

            {!isFixedRoute && (
              <button
                type="button"
                data-cy="return-select-supplier-btn"
                onClick={onSelectSupplier}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                Chọn NCC
              </button>
            )}
          </div>
          {errorSupplier && <ErrorMessage message={errorSupplier} />}
        </div>
      )}
    </div>
  );
};

export default ReturnPartnerSection;
