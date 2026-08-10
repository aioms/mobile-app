import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
} from "@ionic/react";
import { filterOutline, calendarOutline } from "ionicons/icons";
import { ReceiptPaymentExpenseType } from "@/common/enums/receipt";
import { PaymentMethod } from "@/common/enums/payment";
import DatePicker from "@/components/DatePicker";

export interface FilterState {
  expenseType: ReceiptPaymentExpenseType | "all";
  startDate: string;
  endDate: string;
  paymentMethod: PaymentMethod | "all";
  isDirectExport: boolean | null;
}

interface PaymentReceiptFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

const expenseTypes = [
  { value: "all", label: "Tất cả" },
  { value: ReceiptPaymentExpenseType.SUPPLIER_PAYMENT, label: "Thanh toán NCC" },
  { value: ReceiptPaymentExpenseType.TRANSPORTATION, label: "Vận chuyển" },
  { value: ReceiptPaymentExpenseType.UTILITIES, label: "Điện nước" },
  { value: ReceiptPaymentExpenseType.RENT, label: "Thuê mặt bằng" },
  { value: ReceiptPaymentExpenseType.LABOR, label: "Nhân công" },
  { value: ReceiptPaymentExpenseType.CASH_WITHDRAWAL_SANG, label: "Rút tiền Cô Sang" },
  { value: ReceiptPaymentExpenseType.OTHER, label: "Khác" },
];

const paymentMethods = [
  { value: "all", label: "Tất cả" },
  { value: PaymentMethod.CASH, label: "Tiền mặt" },
  { value: PaymentMethod.BANK_TRANSFER, label: "Chuyển khoản" },
  { value: PaymentMethod.CREDIT_CARD, label: "Thẻ tín dụng" },
];

const PaymentReceiptFilterModal: React.FC<PaymentReceiptFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleReset = () => {
    setFilters({
      expenseType: "all",
      startDate: "",
      endDate: "",
      paymentMethod: "all",
      isDirectExport: null,
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const isInvalidDateRange =
    Boolean(filters.startDate) &&
    Boolean(filters.endDate) &&
    filters.startDate > filters.endDate;

  const activeFiltersCount =
    (filters.expenseType !== "all" ? 1 : 0) +
    (filters.paymentMethod !== "all" ? 1 : 0) +
    (filters.isDirectExport !== null ? 1 : 0) +
    (filters.startDate || filters.endDate ? 1 : 0);

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.85}
      breakpoints={[0, 0.85, 1]}
      className="filter-modal"
    >
      <IonPage>
        <IonHeader className="ion-no-border border-b border-gray-100">
          <IonToolbar>
            <IonTitle className="text-base font-semibold text-gray-900">
              Bộ lọc phiếu chi
            </IonTitle>
            <IonButtons slot="end">
              <IonButton
                onClick={onClose}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Đóng
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="bg-gray-50">
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-5">
              {/* Active Filters Header */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    <IonIcon icon={filterOutline} className="text-xs" />
                    <span>Đã chọn {activeFiltersCount} điều kiện</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                  >
                    Xóa lọc
                  </button>
                </div>
              )}

              {/* 1. Expense Type Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Loại chi phí
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {expenseTypes.map((type) => {
                    const isSelected = filters.expenseType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFilters({ ...filters, expenseType: type.value as any })
                        }
                        className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Payment Method Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => {
                    const isSelected = filters.paymentMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() =>
                          setFilters({ ...filters, paymentMethod: method.value as any })
                        }
                        className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Export Type Filter (isDirectExport) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Hình thức xuất
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Tất cả", value: null },
                    { label: "Xuất thẳng", value: true },
                    { label: "Qua kho", value: false },
                  ].map((option) => {
                    const isSelected = filters.isDirectExport === option.value;
                    return (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() =>
                          setFilters({ ...filters, isDirectExport: option.value })
                        }
                        className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Date Range Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Khoảng thời gian
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <IonIcon icon={calendarOutline} className="text-xs text-gray-400" />
                      Từ ngày
                    </span>
                    <DatePicker
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          startDate: (e.detail.value as string) || "",
                        })
                      }
                      presentation="date"
                      attrs={{ id: "payment-filter-start-date" }}
                      extraClassName="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <IonIcon icon={calendarOutline} className="text-xs text-gray-400" />
                      Đến ngày
                    </span>
                    <DatePicker
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          endDate: (e.detail.value as string) || "",
                        })
                      }
                      presentation="date"
                      attrs={{ id: "payment-filter-end-date" }}
                      extraClassName="w-full"
                    />
                  </div>
                </div>

                {isInvalidDateRange && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    Từ ngày không được lớn hơn đến ngày
                  </p>
                )}
              </div>
            </div>
          </div>
        </IonContent>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex gap-3">
            <IonButton
              className="flex-1 h-11"
              fill="outline"
              onClick={handleReset}
            >
              Đặt lại
            </IonButton>
            <IonButton
              className="flex-1 h-11"
              onClick={handleApply}
              disabled={Boolean(isInvalidDateRange)}
            >
              Áp dụng
            </IonButton>
          </div>
        </div>
      </IonPage>
    </IonModal>
  );
};

export default PaymentReceiptFilterModal;
