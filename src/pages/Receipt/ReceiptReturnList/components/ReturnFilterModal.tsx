import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonPage,
} from "@ionic/react";
import { ReceiptReturnStatus } from "@/types/receipt-return.type";
import DatePicker from "@/components/DatePicker";

export interface ReturnFilterState {
  startDate: string;
  endDate: string;
  status: string;
  operationType: "all" | "return" | "exchange";
  refType: "all" | "order" | "debt";
}

interface ReturnFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ReturnFilterState) => void;
  currentFilters: ReturnFilterState;
}

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: ReceiptReturnStatus.DRAFT, label: "Chờ xử lý / Chờ duyệt" },
  { value: ReceiptReturnStatus.PROCESSING, label: "Đang xử lý" },
  { value: ReceiptReturnStatus.COMPLETED, label: "Đã hoàn tất" },
  { value: ReceiptReturnStatus.CANCELLED, label: "Đã hủy" },
];

const operationOptions = [
  { value: "all", label: "Tất cả nghiệp vụ" },
  { value: "return", label: "Trả hàng (Hoàn tiền)" },
  { value: "exchange", label: "Đổi hàng" },
];

const refTypeOptions = [
  { value: "all", label: "Tất cả nguồn" },
  { value: "order", label: "Từ Đơn hàng" },
  { value: "debt", label: "Từ Phiếu nợ" },
];

const ReturnFilterModal: React.FC<ReturnFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<ReturnFilterState>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleReset = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "all",
      operationType: "all",
      refType: "all",
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.85}
      breakpoints={[0, 0.85, 1]}
    >
      <IonPage>
        <IonHeader className="ion-no-border border-b border-gray-100">
          <IonToolbar>
            <IonTitle className="text-base font-bold text-gray-900">
              Bộ lọc phiếu trả
            </IonTitle>
            <IonButtons slot="end">
              <IonButton
                data-cy="return-filter-close-btn"
                color="medium"
                onClick={onClose}
                className="text-sm font-medium"
              >
                Đóng
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent data-cy="return-filter-modal" className="ion-padding bg-gray-50">
          <div className="space-y-5 pb-6">
            {/* 1. Date Range */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Khoảng ngày trả
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-gray-500 mb-1">
                    Từ ngày
                  </span>
                  <DatePicker
                    value={filters.startDate}
                    onChange={(val) =>
                      setFilters((prev) => ({ ...prev, startDate: val }))
                    }
                    presentation="date"
                    emptyText="Chọn ngày"
                    clearable
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-gray-500 mb-1">
                    Đến ngày
                  </span>
                  <DatePicker
                    value={filters.endDate}
                    onChange={(val) =>
                      setFilters((prev) => ({ ...prev, endDate: val }))
                    }
                    presentation="date"
                    emptyText="Chọn ngày"
                    clearable
                  />
                </div>
              </div>
            </div>

            {/* 2. Operation Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Loại nghiệp vụ
              </label>
              <div className="grid grid-cols-2 gap-2">
                {operationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    data-cy={`return-filter-op-${opt.value}`}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        operationType: opt.value as any,
                      }))
                    }
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                      filters.operationType === opt.value
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Status */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Trạng thái
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    data-cy={`return-filter-status-${opt.value}`}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, status: opt.value }))
                    }
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      filters.status === opt.value
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Ref Type */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Nguồn phiếu
              </label>
              <div className="flex gap-2">
                {refTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    data-cy={`return-filter-ref-${opt.value}`}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        refType: opt.value as any,
                      }))
                    }
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                      filters.refType === opt.value
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </IonContent>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
          <button
            type="button"
            data-cy="return-filter-reset"
            onClick={handleReset}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
            Đặt lại
          </button>
          <button
            type="button"
            data-cy="return-filter-apply"
            onClick={handleApply}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20"
          >
            Áp dụng
          </button>
        </div>
      </IonPage>
    </IonModal>
  );
};

export default ReturnFilterModal;
