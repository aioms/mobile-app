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
  IonInput,
  IonSelect,
  IonSelectOption,
  useIonModal,
  IonChip,
  IonIcon,
} from "@ionic/react";
import { close } from "ionicons/icons";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import { PRODUCT_STATUS } from "@/common/constants/product";

export interface FilterValues {
  categories: string[];
  suppliers: string[];
  status: string;
  priceRange: {
    min: number | null;
    max: number | null;
  };
}

interface Supplier {
  id: string;
  name: string;
}

interface Props {
  dismiss: (data?: any, role?: string) => void;
  initialFilters: FilterValues;
}

const defaultFilters: FilterValues = {
  categories: [],
  suppliers: [],
  status: "",
  priceRange: { min: null, max: null },
};

const FilterModal: React.FC<Props> = ({ dismiss, initialFilters }) => {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
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
    dismiss: (data: string, role: string) => dismissSupplier(data, role),
  });

  const openSupplierModal = () => {
    presentSupplier({
      onWillDismiss: (ev: CustomEvent) => {
        if (ev.detail.role === "confirm") {
          const data = ev.detail.data;

          if (data && !filters.suppliers.includes(data)) {
            setFilters((prev) => ({
              ...prev,
              suppliers: [...prev.suppliers, data],
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
    setFilters(defaultFilters);
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

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bộ lọc</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => dismiss()}>Đóng</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-base font-medium mb-2">Lọc sản phẩm</h3>
            <IonList className="rounded-lg">
              {/* Categories Select */}
              {/* <IonItem button detail onClick={onSelectCategories}>
                <IonLabel>
                  <h2>Nhóm hàng</h2>
                  <p className="text-gray-500">
                    {filters.categories.length
                      ? `Đã chọn ${filters.categories.length} nhóm`
                      : "Chọn nhóm hàng"}
                  </p>
                </IonLabel>
              </IonItem> */}

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
                <IonLabel>Trạng thái hàng</IonLabel>
                <IonSelect
                  value={filters.status}
                  onIonChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.detail.value }))
                  }
                >
                  <IonSelectOption value="">Tất cả</IonSelectOption>
                  <IonSelectOption value={PRODUCT_STATUS.ACTIVE}>
                    Đang kinh doanh
                  </IonSelectOption>
                  <IonSelectOption value={PRODUCT_STATUS.INACTIVE}>
                    Ngừng kinh doanh
                  </IonSelectOption>
                  <IonSelectOption value={PRODUCT_STATUS.DRAFT}>
                    Nháp
                  </IonSelectOption>
                </IonSelect>
              </IonItem>

              {/* Price Range */}
              <IonItem>
                <IonLabel position="stacked">Giá bán</IonLabel>
                <div className="flex items-center gap-2 mt-2">
                  <IonInput
                    type="number"
                    placeholder="Từ"
                    value={filters.priceRange.min}
                    onIonInput={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: {
                          ...prev.priceRange,
                          min: e.detail.value ? Number(e.detail.value) : null,
                        },
                      }))
                    }
                  />
                  <span>-</span>
                  <IonInput
                    type="number"
                    placeholder="Đến"
                    value={filters.priceRange.max}
                    onIonInput={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: {
                          ...prev.priceRange,
                          max: e.detail.value ? Number(e.detail.value) : null,
                        },
                      }))
                    }
                  />
                </div>
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
