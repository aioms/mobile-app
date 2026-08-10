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
import { close, chevronForward, storefrontOutline, filterOutline, calendarOutline } from "ionicons/icons";

import DatePicker from "@/components/DatePicker";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import {
  RECEIPT_IMPORT_STATUS,
  getStatusLabel,
  TReceiptImportStatus,
} from "@/common/constants/receipt-import.constant";
import {
  ReceiptImportFilterValues,
  Supplier,
  defaultReceiptImportFilters,
  ReceiptImportFilterModalProps,
} from "../types/FilterModal.d";

const FilterModal: React.FC<ReceiptImportFilterModalProps> = ({ dismiss, initialFilters }) => {
  const [filters, setFilters] = useState<ReceiptImportFilterValues>(initialFilters);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);

  // Sync initialFilters
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Sync selected suppliers from `${id}__${name}` tokens
  useEffect(() => {
    if (!filters.suppliers) {
      setSelectedSuppliers([]);
      return;
    }
    const suppliers = filters.suppliers.map((supplierId) => {
      const parts = supplierId.split("__");
      return { id: parts[0], name: parts[1] || parts[0] };
    });
    setSelectedSuppliers(suppliers);
  }, [filters.suppliers]);

  // Supplier Modal
  const [presentSupplier, dismissSupplier] = useIonModal(ModalSelectSupplier, {
    dismiss: (data: string[] | string, role: string) => dismissSupplier(data, role),
    multi: true,
    initialSelectedNames: filters.suppliers,
  });

  const openSupplierModal = () => {
    presentSupplier({
      onWillDismiss: (ev: CustomEvent) => {
        if (ev.detail.role === "confirm") {
          const data = ev.detail.data;
          if (Array.isArray(data)) {
            setFilters((prev) => ({
              ...prev,
              suppliers: data,
            }));
          }
        }
      },
    });
  };

  const handleRemoveSupplier = (supplierId: string) => {
    setFilters((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((s) => !s.startsWith(`${supplierId}__`)),
    }));
  };

  const toggleStatus = (statusValue: TReceiptImportStatus) => {
    setFilters((prev) => {
      const current = prev.status || [];
      const exists = current.includes(statusValue);
      const nextStatus = exists
        ? current.filter((s) => s !== statusValue)
        : [...current, statusValue];
      return { ...prev, status: nextStatus };
    });
  };

  const handleFromDateChange = (e: CustomEvent) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        from: (e.detail.value as string) || null,
      },
    }));
  };

  const handleToDateChange = (e: CustomEvent) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        to: (e.detail.value as string) || null,
      },
    }));
  };

  const handleConfirm = () => {
    dismiss(filters, "confirm");
  };

  const handleReset = () => {
    setSelectedSuppliers([]);
    setFilters(defaultReceiptImportFilters);
  };

  const isInvalidDateRange =
    filters.dateRange.from &&
    filters.dateRange.to &&
    filters.dateRange.from > filters.dateRange.to;

  const activeFiltersCount =
    (filters.suppliers?.length || 0) +
    (filters.status?.length || 0) +
    (filters.dateRange?.from || filters.dateRange?.to ? 1 : 0);

  const statusOptions: { value: TReceiptImportStatus; label: string }[] = [
    { value: RECEIPT_IMPORT_STATUS.DRAFT, label: getStatusLabel(RECEIPT_IMPORT_STATUS.DRAFT) },
    { value: RECEIPT_IMPORT_STATUS.PROCESSING, label: getStatusLabel(RECEIPT_IMPORT_STATUS.PROCESSING) },
    { value: RECEIPT_IMPORT_STATUS.WAITING, label: getStatusLabel(RECEIPT_IMPORT_STATUS.WAITING) },
    { value: RECEIPT_IMPORT_STATUS.COMPLETED, label: getStatusLabel(RECEIPT_IMPORT_STATUS.COMPLETED) },
    { value: RECEIPT_IMPORT_STATUS.PAID, label: getStatusLabel(RECEIPT_IMPORT_STATUS.PAID) },
    { value: RECEIPT_IMPORT_STATUS.CANCELLED, label: getStatusLabel(RECEIPT_IMPORT_STATUS.CANCELLED) },
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonTitle className="text-base font-semibold text-gray-900">
            Bộ lọc phiếu nhập
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

            {/* 1. Supplier Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Nhà cung cấp
              </label>

              <div
                onClick={openSupplierModal}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <IonIcon icon={storefrontOutline} className="text-base" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedSuppliers.length
                        ? `Đã chọn ${selectedSuppliers.length} nhà cung cấp`
                        : "Tất cả nhà cung cấp"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {selectedSuppliers.length
                        ? selectedSuppliers.map((s) => s.name).join(", ")
                        : "Chạm để chọn nhà cung cấp"}
                    </p>
                  </div>
                </div>
                <IonIcon
                  icon={chevronForward}
                  className="text-gray-400 text-base flex-shrink-0 ml-2"
                />
              </div>

              {/* Selected Suppliers Chips */}
              {selectedSuppliers.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedSuppliers.map((supplier) => (
                    <span
                      key={supplier.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium"
                    >
                      <span>{supplier.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSupplier(supplier.id);
                        }}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-200/60 text-blue-600 transition-colors"
                      >
                        <IonIcon icon={close} className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Status Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-800">
                  Trạng thái phiếu nhập
                </label>
                {filters.status?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, status: [] }))}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((opt) => {
                  const isSelected = filters.status?.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleStatus(opt.value)}
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
                    value={filters.dateRange.from || undefined}
                    onChange={handleFromDateChange}
                    presentation="date"
                    attrs={{ id: "from-date-picker" }}
                    extraClassName="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <IonIcon icon={calendarOutline} className="text-xs text-gray-400" />
                    Đến ngày
                  </span>
                  <DatePicker
                    value={filters.dateRange.to || undefined}
                    onChange={handleToDateChange}
                    presentation="date"
                    attrs={{ id: "to-date-picker" }}
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