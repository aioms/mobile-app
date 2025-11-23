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
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  useIonModal,
  IonRippleEffect,
  IonList,
} from "@ionic/react";
import { close, search } from "ionicons/icons";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import DatePicker from "@/components/DatePicker";
import ModalSelectCustomer from "@/components/ModalSelectCustomer";
import {
  getStatusLabel,
  RECEIPT_DEBT_STATUS,
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

  const handleClearFilter = () => {
    setSelectedCustomerName("");
    onClearFilters();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bộ lọc</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        {/* Customer Filter */}
        <IonList inset={false} className="space-y-2 p-3">
          <IonItem>
            <IonLabel position="stacked">Theo khách hàng</IonLabel>
            <div
              className="ion-activatable receipt-debt-ripple-parent break-normal p-2"
              onClick={() => openModalSelectCustomer()}
            >
              <IonIcon icon={search} className="text-2xl mr-2" />
              {selectedCustomerName || "Chọn khách hàng"}
              <IonRippleEffect className="custom-ripple"></IonRippleEffect>
            </div>
          </IonItem>

          {/* Receipt Date Filter */}
          <IonItem lines="none">
            <IonLabel position="stacked">Ngày Thu</IonLabel>
            <DatePicker
              value={filters.dueDate}
              presentation="date"
              onChange={(e) =>
                onFilterChange("dueDate", e.detail.value as string)
              }
              attrs={{ id: "receipt-date" }}
              extraClassName="w-full flex items-center justify-start py-2"
            />
          </IonItem>

          {/* Created Date Filter */}
          <IonItem lines="none">
            <IonLabel position="stacked">Ngày Tạo</IonLabel>
            <DatePicker
              value={filters.createdDate}
              presentation="date"
              onChange={(e) =>
                onFilterChange("createdDate", e.detail.value as string)
              }
              attrs={{ id: "created-date" }}
              extraClassName="w-full flex items-center justify-start py-2"
            />
          </IonItem>

          {/* Status Filter */}
          <IonItem>
            <IonLabel position="stacked">Trạng Thái</IonLabel>
            <IonSelect
              value={filters.status}
              placeholder="Chọn trạng thái"
              onIonChange={(e) =>
                onFilterChange("status", e.detail.value as string)
              }
            >
              <IonSelectOption value="">Tất cả</IonSelectOption>
              {Object.entries(RECEIPT_DEBT_STATUS).map(([key, value]) => (
                <IonSelectOption key={key} value={value}>
                  {getStatusLabel(value)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </IonList>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          <IonButton
            expand="block"
            fill="outline"
            onClick={handleClearFilter}
            className="flex-1 text-red-500"
          >
            Xóa bộ lọc
          </IonButton>
          <IonButton expand="block" onClick={onApplyFilters} className="flex-1">
            Áp dụng
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default FilterModal;
