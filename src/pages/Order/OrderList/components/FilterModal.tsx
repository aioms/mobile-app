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
  useIonModal,
} from "@ionic/react";
import { close, chevronForward, personOutline, filterOutline, calendarOutline } from "ionicons/icons";
import DatePicker from "@/components/DatePicker";
import ModalSelectCustomer from "@/components/ModalSelectCustomer";
import { OrderStatus } from "@/common/enums/order";
import { getOrderStatusLabel } from "@/common/constants/order";

export interface OrderFilterValues {
  status: string;
  startDate: string;
  endDate: string;
  customerId: string;
  customerName: string;
}

interface Props {
  dismiss: (data?: OrderFilterValues, role?: string) => void;
  initialFilters: OrderFilterValues;
}

export const defaultOrderFilters: OrderFilterValues = {
  status: "",
  startDate: "",
  endDate: "",
  customerId: "",
  customerName: "",
};

const FilterModal: React.FC<Props> = ({ dismiss, initialFilters }) => {
  const [filters, setFilters] = useState<OrderFilterValues>(initialFilters);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>(
    initialFilters.customerName || ""
  );

  useEffect(() => {
    setFilters(initialFilters);
    setSelectedCustomerName(initialFilters.customerName || "");
  }, [initialFilters]);

  // Modal Select Customer
  const [presentCustomerModal, dismissCustomerModal] = useIonModal(
    ModalSelectCustomer,
    {
      dismiss: (data: any, role: string) => dismissCustomerModal(data, role),
    }
  );

  const openCustomerModal = () => {
    presentCustomerModal({
      onWillDismiss: (ev: CustomEvent) => {
        if (ev.detail.role === "confirm") {
          const data = ev.detail.data;
          if (data) {
            const [id, name] = data.split("__");
            setSelectedCustomerName(name);
            setFilters((prev) => ({
              ...prev,
              customerId: id,
              customerName: name,
            }));
          } else {
            setSelectedCustomerName("");
            setFilters((prev) => ({
              ...prev,
              customerId: "",
              customerName: "",
            }));
          }
        }
      },
    });
  };

  const handleRemoveCustomer = () => {
    setSelectedCustomerName("");
    setFilters((prev) => ({
      ...prev,
      customerId: "",
      customerName: "",
    }));
  };

  const handleConfirm = () => {
    dismiss(filters, "confirm");
  };

  const handleReset = () => {
    setSelectedCustomerName("");
    setFilters(defaultOrderFilters);
  };

  const isInvalidDateRange =
    Boolean(filters.startDate) &&
    Boolean(filters.endDate) &&
    filters.startDate > filters.endDate;

  const activeFiltersCount =
    (filters.status ? 1 : 0) +
    (filters.customerId ? 1 : 0) +
    (filters.startDate || filters.endDate ? 1 : 0);

  const statusOptions = [
    { value: "", label: "Tất cả" },
    { value: OrderStatus.DRAFT, label: getOrderStatusLabel(OrderStatus.DRAFT) },
    { value: OrderStatus.PENDING, label: getOrderStatusLabel(OrderStatus.PENDING) },
    { value: OrderStatus.COMPLETED, label: getOrderStatusLabel(OrderStatus.COMPLETED) },
    { value: OrderStatus.CANCELLED, label: getOrderStatusLabel(OrderStatus.CANCELLED) },
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonTitle className="text-base font-semibold text-gray-900">
            Bộ lọc đơn hàng
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

            {/* 1. Customer Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Khách hàng
              </label>

              <div
                onClick={openCustomerModal}
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
                Trạng thái đơn hàng
              </label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((opt) => {
                  const isSelected = filters.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, status: opt.value }))
                      }
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

            {/* 3. Date Range Filter */}
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
                      setFilters((prev) => ({
                        ...prev,
                        startDate: (e.detail.value as string) || "",
                      }))
                    }
                    presentation="date"
                    attrs={{ id: "order-filter-start-date" }}
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
                      setFilters((prev) => ({
                        ...prev,
                        endDate: (e.detail.value as string) || "",
                      }))
                    }
                    presentation="date"
                    attrs={{ id: "order-filter-end-date" }}
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
