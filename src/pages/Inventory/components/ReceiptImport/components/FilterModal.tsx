import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  useIonModal,
  IonChip,
  IonIcon,
} from "@ionic/react";
import { close } from "ionicons/icons";

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

  // Initialize selected suppliers from initialFilters
  useEffect(() => {
    const suppliers = filters.suppliers.map((supplierId) => {
      const [id, name] = supplierId.split("__");
      return { id, name };
    });
    setSelectedSuppliers(suppliers);
  }, [filters.suppliers]);

  // Supplier Modal
  const [presentSupplier, dismissSupplier] = useIonModal(ModalSelectSupplier, {
    dismiss: (data: string[], role: string) => dismissSupplier(data, role),
    multi: true,
  });

  const openSupplierModal = () => {
    presentSupplier({
      onWillDismiss: (ev: CustomEvent) => {
        if (ev.detail.role === "confirm") {
          const data = ev.detail.data;
          
          if (data && Array.isArray(data)) {
            setFilters((prev) => ({
              ...prev,
              suppliers: data,
            }));
          }
        }
      },
    });
  };

  const handleConfirm = () => {
    dismiss(filters, "confirm");
  };

  const handleReset = () => {
    setSelectedSuppliers([]);
    setFilters(defaultReceiptImportFilters);
  };

  const removeSupplier = (supplier: Supplier) => {
    setSelectedSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
    setFilters((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter(
        (s) => s !== `${supplier.id}__${supplier.name}`
      ),
    }));
  };

  const handleStatusChange = (selectedStatus: TReceiptImportStatus[]) => {
    setFilters((prev) => ({
      ...prev,
      status: selectedStatus,
    }));
  };

  const handleFromDateChange = (e: any) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        from: e.detail.value,
      },
    }));
  };

  const handleToDateChange = (e: any) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        to: e.detail.value,
      },
    }));
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bộ lọc phiếu nhập</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => dismiss()}>Đóng</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-base font-medium mb-2">Lọc phiếu nhập kho</h3>
            <IonList className="rounded-lg py-4">
              {/* Suppliers Select */}
              <IonItem button detail onClick={openSupplierModal}>
                <IonLabel>
                  <h2>Nhà cung cấp</h2>
                  <p className="text-gray-500">
                    {selectedSuppliers.length
                      ? `Đã chọn ${selectedSuppliers.length} nhà cung cấp`
                      : "Chọn nhà cung cấp"}
                  </p>
                </IonLabel>
              </IonItem>

              {/* Selected Suppliers */}
              {selectedSuppliers.length > 0 && (
                <IonItem>
                  <div className="flex flex-wrap gap-2 py-2">
                    {selectedSuppliers.map((supplier) => (
                      <IonChip
                        key={supplier.id}
                        onClick={() => removeSupplier(supplier)}
                      >
                        <IonLabel>{supplier.name}</IonLabel>
                        <IonIcon icon={close} />
                      </IonChip>
                    ))}
                  </div>
                </IonItem>
              )}

              {/* Status Select */}
              <IonItem>
                <IonLabel>Trạng thái</IonLabel>
                <IonSelect
                  value={filters.status}
                  onIonChange={(e) => handleStatusChange(e.detail.value)}
                  multiple={true}
                  placeholder="Chọn trạng thái"
                >
                  <IonSelectOption value={RECEIPT_IMPORT_STATUS.DRAFT}>
                    {getStatusLabel(RECEIPT_IMPORT_STATUS.DRAFT)}
                  </IonSelectOption>
                  <IonSelectOption value={RECEIPT_IMPORT_STATUS.PROCESSING}>
                    {getStatusLabel(RECEIPT_IMPORT_STATUS.PROCESSING)}
                  </IonSelectOption>
                  <IonSelectOption value={RECEIPT_IMPORT_STATUS.WAITING}>
                    {getStatusLabel(RECEIPT_IMPORT_STATUS.WAITING)}
                  </IonSelectOption>
                  <IonSelectOption value={RECEIPT_IMPORT_STATUS.COMPLETED}>
                    {getStatusLabel(RECEIPT_IMPORT_STATUS.COMPLETED)}
                  </IonSelectOption>
                  <IonSelectOption value={RECEIPT_IMPORT_STATUS.CANCELLED}>
                    {getStatusLabel(RECEIPT_IMPORT_STATUS.CANCELLED)}
                  </IonSelectOption>
                </IonSelect>
              </IonItem>

              {/* Date Range */}
              <IonItem>
                <IonLabel position="stacked">Từ ngày</IonLabel>
                <DatePicker
                  value={filters.dateRange.from || undefined}
                  onChange={handleFromDateChange}
                  presentation="date"
                  attrs={{
                    id: 'from-date-picker',
                    disabled: false,
                  }}
                  extraClassName="mt-2"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Đến ngày</IonLabel>
                <DatePicker
                  value={filters.dateRange.to || undefined}
                  onChange={handleToDateChange}
                  presentation="date"
                  attrs={{
                    id: 'to-date-picker',
                    disabled: false,
                  }}
                  extraClassName="mt-2"
                />
              </IonItem>
            </IonList>
          </div>
        </div>
      </IonContent>

      <div className="p-4 border-t">
        <div className="flex justify-between">
          <IonButton
            className="grow"
            expand="block"
            fill="outline"
            onClick={handleReset}
          >
            Đặt lại
          </IonButton>
          <IonButton className="grow" expand="block" onClick={handleConfirm}>
            Áp dụng
          </IonButton>
        </div>
      </div>
    </>
  );
};

export default FilterModal;