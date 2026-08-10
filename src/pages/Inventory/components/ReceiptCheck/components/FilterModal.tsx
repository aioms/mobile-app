import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonPage,
} from "@ionic/react";
import { filterOutline, calendarOutline } from "ionicons/icons";
import DatePicker from "@/components/DatePicker";
import { RECEIPT_CHECK_STATUS } from "@/common/constants/receipt-check.constant";

export interface ReceiptCheckFilterValues {
  status: string;
  startDate: string;
  endDate: string;
}

interface Props {
  dismiss: (data?: ReceiptCheckFilterValues, role?: string) => void;
  initialFilters: ReceiptCheckFilterValues;
}

export const defaultReceiptCheckFilters: ReceiptCheckFilterValues = {
  status: "",
  startDate: "",
  endDate: "",
};

const FilterModal: React.FC<Props> = ({ dismiss, initialFilters }) => {
  const [filters, setFilters] = useState<ReceiptCheckFilterValues>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleFilterChange = (key: keyof ReceiptCheckFilterValues, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleConfirm = () => {
    dismiss(filters, "confirm");
  };

  const handleReset = () => {
    setFilters(defaultReceiptCheckFilters);
  };

  const isInvalidDateRange =
    Boolean(filters.startDate) &&
    Boolean(filters.endDate) &&
    filters.startDate > filters.endDate;

  const activeFiltersCount =
    (filters.status ? 1 : 0) +
    (filters.startDate || filters.endDate ? 1 : 0);

  const statusOptions = [
    { value: "", label: "Tất cả" },
    { value: RECEIPT_CHECK_STATUS.PENDING, label: "Chờ xử lý" },
    { value: RECEIPT_CHECK_STATUS.PROCESSING, label: "Đang xử lý" },
    { value: RECEIPT_CHECK_STATUS.BALANCING_REQUIRED, label: "Cần cân bằng" },
    { value: RECEIPT_CHECK_STATUS.BALANCED, label: "Đã cân bằng" },
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonTitle className="text-base font-semibold text-gray-900">
            Bộ lọc phiếu kiểm kho
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => dismiss()}
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

            {/* 1. Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Trạng thái
              </label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((opt) => {
                  const isSelected = filters.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleFilterChange("status", opt.value)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Date Range Filter */}
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
                    onChange={(e) => handleFilterChange("startDate", (e.detail.value as string) || "")}
                    presentation="date"
                    attrs={{ id: "startDate" }}
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
                    onChange={(e) => handleFilterChange("endDate", (e.detail.value as string) || "")}
                    presentation="date"
                    attrs={{ id: "endDate" }}
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
            onClick={handleConfirm}
            disabled={Boolean(isInvalidDateRange)}
          >
            Áp dụng
          </IonButton>
        </div>
      </div>
    </IonPage>
  );
};

export default FilterModal;
