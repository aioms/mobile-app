import React, { useEffect, useState } from "react";
import {
  IonSearchbar,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import DatePicker from "@/components/DatePicker";
import { OrderStatus } from "@/common/enums/order";

interface FilterSectionProps {
  onFilterChange: (filters: Record<string, string>) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ onFilterChange }) => {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [timeFilter, setTimeFilter] = useState({
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const filters: Record<string, string> = {};

    if (keyword) filters.keyword = keyword;
    if (status) filters.status = status;
    if (timeFilter.startDate) filters.startDate = timeFilter.startDate;
    if (timeFilter.endDate) filters.endDate = timeFilter.endDate;

    onFilterChange(filters);
  }, [keyword, status, timeFilter]);

  const handleDateChange = (type: "startDate" | "endDate", value: string) => {
    setTimeFilter((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  return (
    <div className="filter-section bg-card rounded-lg shadow-sm p-3 mb-2">
      <IonSearchbar
        value={keyword}
        onIonChange={(e) => setKeyword(e.detail.value || "")}
        placeholder="Tìm kiếm đơn hàng"
        className="mb-2"
        debounce={300}
      />

      <IonItem className="mb-2">
        <IonLabel>Trạng thái</IonLabel>
        <IonSelect
          value={status}
          placeholder="Tất cả"
          onIonChange={(e) => setStatus(e.detail.value)}
        >
          <IonSelectOption value="">Tất cả</IonSelectOption>
          <IonSelectOption value={OrderStatus.PENDING}>
            Chờ thanh toán
          </IonSelectOption>
          <IonSelectOption value={OrderStatus.PAID}>
            Đã thanh toán
          </IonSelectOption>
          <IonSelectOption value={OrderStatus.CANCELLED}>
            Đã hủy
          </IonSelectOption>
        </IonSelect>
      </IonItem>

      <div className="date-filter-container">
        <IonItem className="flex-1">
          <IonLabel position="stacked">Từ ngày</IonLabel>
          <DatePicker
            value={timeFilter.startDate}
            onChange={(value) => handleDateChange("startDate", value)}
            extraClassName="pb-2"
            attrs={{ id: "startDate" }}
            presentation="date"
          />
        </IonItem>
        <IonItem className="flex-1">
          <IonLabel position="stacked">Đến ngày</IonLabel>
          <DatePicker
            value={timeFilter.endDate}
            onChange={(value) => handleDateChange("endDate", value)}
            extraClassName="pb-2"
            attrs={{ id: "endDate" }}
            presentation="date"
          />
        </IonItem>
      </div>
    </div>
  );
};

export default FilterSection;
