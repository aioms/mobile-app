import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonPage,
  useIonModal,
} from "@ionic/react";
import { close, chevronForward, personOutline, filterOutline, calendarOutline } from "ionicons/icons";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import DatePicker from "@/components/DatePicker";
import ModalSelectCustomer from "@/components/ModalSelectCustomer";
import {
  getStatusLabel,
  RECEIPT_DEBT_STATUS,
  TReceiptDebtStatus,
} from "@/common/constants/receipt-debt.constant";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    customerId: string;
    dueDate: string;
    createdDate: string;
    status: string;
  };
  onFilterChange: (
    field: keyof FilterModalProps["filters"],
    value: string
  ) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
}) => {
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");

  const [presentModalCustomer, dismissModalCustomer] = useIonModal(
    ModalSelectCustomer,
    {
      dismiss: (data: any, role: string) => dismissModalCustomer(data, role),
    }
  );

  const openModalSelectCustomer = () => {
    presentModalCustomer({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;

        if (role !== "confirm") return;

        if (!data) {
          setSelectedCustomerName("");
          onFilterChange("customerId", "");
          return;
        }

        const [customerId, customerName] = data.split("__");
        setSelectedCustomerName(customerName);

        // Update form data with the selected customer ID
        onFilterChange("customerId", customerId);
      },
    });
  };

  const handleRemoveCustomer = () => {
    setSelectedCustomerName("");
    onFilterChange("customerId", "");
  };

  const handleClearFilter = () => {
    setSelectedCustomerName("");
    onClearFilters();
  };

  const activeFiltersCount =
    (filters.customerId ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.dueDate ? 1 : 0) +
    (filters.createdDate ? 1 : 0);

  const statusOptions: { value: string; label: string }[] = [
    { value: "", label: "Tất cả" },
    { value: RECEIPT_DEBT_STATUS.PENDING, label: getStatusLabel(RECEIPT_DEBT_STATUS.PENDING as TReceiptDebtStatus) },
    { value: RECEIPT_DEBT_STATUS.PARTIAL_PAID, label: getStatusLabel(RECEIPT_DEBT_STATUS.PARTIAL_PAID as TReceiptDebtStatus) },
    { value: RECEIPT_DEBT_STATUS.COMPLETED, label: getStatusLabel(RECEIPT_DEBT_STATUS.COMPLETED as TReceiptDebtStatus) },
    { value: RECEIPT_DEBT_STATUS.OVERDUE, label: getStatusLabel(RECEIPT_DEBT_STATUS.OVERDUE as TReceiptDebtStatus) },
    { value: RECEIPT_DEBT_STATUS.CANCELLED, label: getStatusLabel(RECEIPT_DEBT_STATUS.CANCELLED as TReceiptDebtStatus) },
  ];

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonPage>
        <IonHeader className="ion-no-border border-b border-gray-100">
          <IonToolbar>
            <IonTitle className="text-base font-semibold text-gray-900">
              Bộ lọc phiếu thu & công nợ
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
                    onClick={handleClearFilter}
                    className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                  >
                    Xóa lọc
                  </button>
                </div>
              )}

              {/* 1. Customer Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Khách hàng
                </label>

                <div
                  onClick={openModalSelectCustomer}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <IonIcon icon={personOutline} className="text-base" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedCustomerName || "Tất cả khách hàng"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {selectedCustomerName ? "Đã chọn khách hàng" : "Chạm để chọn khách hàng"}
                      </p>
                    </div>
                  </div>
                  <IonIcon
                    icon={chevronForward}
                    className="text-gray-400 text-base flex-shrink-0 ml-2"
                  />
                </div>

                {selectedCustomerName && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium">
                      <span>{selectedCustomerName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomer();
                        }}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-200/60 text-blue-600 transition-colors"
                      >
                        <IonIcon icon={close} className="text-xs" />
                      </button>
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Status Filter */}
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
                        onClick={() => onFilterChange("status", opt.value)}
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

              {/* 3. Date Filters */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Thời gian
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <IonIcon icon={calendarOutline} className="text-xs text-gray-400" />
                      Ngày thu
                    </span>
                    <DatePicker
                      value={filters.dueDate}
                      onChange={(e) =>
                        onFilterChange("dueDate", (e.detail.value as string) || "")
                      }
                      presentation="date"
                      attrs={{ id: "receipt-date" }}
                      extraClassName="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                      <IonIcon icon={calendarOutline} className="text-xs text-gray-400" />
                      Ngày tạo
                    </span>
                    <DatePicker
                      value={filters.createdDate}
                      onChange={(e) =>
                        onFilterChange("createdDate", (e.detail.value as string) || "")
                      }
                      presentation="date"
                      attrs={{ id: "created-date" }}
                      extraClassName="w-full"
                    />
                  </div>
                </div>
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
              onClick={handleClearFilter}
            >
              Đặt lại
            </IonButton>
            <IonButton
              className="flex-1 h-11"
              onClick={onApplyFilters}
            >
              Áp dụng
            </IonButton>
          </div>
        </div>
      </IonPage>
    </IonModal>
  );
};

export default FilterModal;
