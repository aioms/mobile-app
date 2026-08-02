import React, { useState } from "react";
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
  IonIcon,
} from "@ionic/react";
import { close } from "ionicons/icons";
import DatePicker from "@/components/DatePicker";
import { RECEIPT_CHECK_STATUS } from "@/common/constants/receipt-check.constant";

export interface ReceiptCheckFilterValues {
  status: string;
  startDate: string;
  endDate: string;
}

interface Props {
  dismiss: (data?: any, role?: string) => void;
  initialFilters: ReceiptCheckFilterValues;
}

export const defaultReceiptCheckFilters: ReceiptCheckFilterValues = {
  status: "",
  startDate: "",
  endDate: "",
};

const FilterModal: React.FC<Props> = ({ dismiss, initialFilters }) => {
  const [filters, setFilters] = useState<ReceiptCheckFilterValues>(initialFilters);

  const handleFilterChange = (key: keyof ReceiptCheckFilterValues, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    dismiss(filters, "confirm");
  };

  const clearFilters = () => {
    setFilters(defaultReceiptCheckFilters);
  };

  return (
    <>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle className="font-bold">Lọc phiếu kiểm kho</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => dismiss(null, "cancel")}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList className="bg-transparent" lines="none">
          {/* Status Filter */}
          <IonItem className="mb-4 bg-white rounded-lg border border-gray-100">
            <IonLabel position="stacked" className="font-medium">Trạng thái</IonLabel>
            <IonSelect
              value={filters.status}
              placeholder="Tất cả"
              onIonChange={(e) => handleFilterChange("status", e.detail.value)}
              className="w-full"
            >
              <IonSelectOption value="">Tất cả</IonSelectOption>
              <IonSelectOption value={RECEIPT_CHECK_STATUS.PENDING}>Cần xử lý</IonSelectOption>
              <IonSelectOption value={RECEIPT_CHECK_STATUS.PROCESSING}>Đang xử lý</IonSelectOption>
              <IonSelectOption value={RECEIPT_CHECK_STATUS.BALANCING_REQUIRED}>Cần cân đối</IonSelectOption>
              <IonSelectOption value={RECEIPT_CHECK_STATUS.BALANCED}>Đã cân đối</IonSelectOption>
            </IonSelect>
          </IonItem>

          {/* Date Range Picker */}
          <div className="flex gap-2 mb-4">
            <IonItem className="flex-1 bg-white rounded-lg border border-gray-100 pb-4">
              <IonLabel position="stacked" className="font-medium">Từ ngày</IonLabel>
              <DatePicker
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.detail.value!)}
                extraClassName="w-full"
                attrs={{ id: "startDate" }}
                presentation="date"
              />
            </IonItem>
            <IonItem className="flex-1 bg-white rounded-lg border border-gray-100 pb-4">
              <IonLabel position="stacked" className="font-medium">Đến ngày</IonLabel>
              <DatePicker
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.detail.value!)}
                extraClassName="w-full"
                attrs={{ id: "endDate" }}
                presentation="date"
              />
            </IonItem>
          </div>
        </IonList>

        <div className="mt-6 flex flex-col gap-3">
          <IonButton expand="block" onClick={applyFilters} className="font-bold m-0 h-12">
            Áp dụng
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={clearFilters} className="font-bold m-0 h-12">
            Xóa bộ lọc
          </IonButton>
        </div>
      </IonContent>
    </>
  );
};

export default FilterModal;
