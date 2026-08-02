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
  IonIcon,
} from "@ionic/react";
import { search } from "ionicons/icons";
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
  dismiss: (data?: any, role?: string) => void;
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

  const handleConfirm = () => {
    dismiss(filters, "confirm");
  };

  const handleReset = () => {
    setSelectedCustomerName("");
    setFilters(defaultOrderFilters);
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bộ lọc đơn hàng</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => dismiss()}>Đóng</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="p-4">
          <IonList className="rounded-lg space-y-3 pb-6">
            {/* Status Select */}
            <IonItem>
              <IonLabel position="stacked">Trạng thái đơn hàng</IonLabel>
              <IonSelect
                value={filters.status}
                placeholder="Tất cả trạng thái"
                onIonChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.detail.value }))
                }
              >
                <IonSelectOption value="">Tất cả</IonSelectOption>
                <IonSelectOption value={OrderStatus.DRAFT}>
                  {getOrderStatusLabel(OrderStatus.DRAFT)}
                </IonSelectOption>
                <IonSelectOption value={OrderStatus.PENDING}>
                  {getOrderStatusLabel(OrderStatus.PENDING)}
                </IonSelectOption>
                <IonSelectOption value={OrderStatus.COMPLETED}>
                  {getOrderStatusLabel(OrderStatus.COMPLETED)}
                </IonSelectOption>
                <IonSelectOption value={OrderStatus.CANCELLED}>
                  {getOrderStatusLabel(OrderStatus.CANCELLED)}
                </IonSelectOption>
              </IonSelect>
            </IonItem>

            {/* Customer Select */}
            <IonItem button detail onClick={openCustomerModal}>
              <IonLabel position="stacked">Khách hàng</IonLabel>
              <div className="flex items-center py-2 text-sm text-gray-700">
                <IonIcon icon={search} className="text-lg mr-2 text-gray-400" />
                {selectedCustomerName ? (
                  <span className="font-medium text-gray-900">{selectedCustomerName}</span>
                ) : (
                  <span className="text-gray-400">Chọn khách hàng</span>
                )}
              </div>
            </IonItem>

            {/* Date Range - Start Date */}
            <IonItem lines="none">
              <IonLabel position="stacked">Từ ngày</IonLabel>
              <DatePicker
                value={filters.startDate}
                presentation="date"
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: e.detail.value as string,
                  }))
                }
                attrs={{ id: "order-filter-start-date" }}
                extraClassName="w-full flex items-center justify-start py-2"
              />
            </IonItem>

            {/* Date Range - End Date */}
            <IonItem lines="none">
              <IonLabel position="stacked">Đến ngày</IonLabel>
              <DatePicker
                value={filters.endDate}
                presentation="date"
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: e.detail.value as string,
                  }))
                }
                attrs={{ id: "order-filter-end-date" }}
                extraClassName="w-full flex items-center justify-start py-2"
              />
            </IonItem>
          </IonList>
        </div>
      </IonContent>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <IonButton
            className="flex-1"
            expand="block"
            fill="outline"
            onClick={handleReset}
          >
            Đặt lại
          </IonButton>
          <IonButton className="flex-1" expand="block" onClick={handleConfirm}>
            Áp dụng
          </IonButton>
        </div>
      </div>
    </>
  );
};

export default FilterModal;
