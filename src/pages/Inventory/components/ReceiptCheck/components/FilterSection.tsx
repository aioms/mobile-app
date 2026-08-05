import React from "react";
import { IonButton, IonIcon, useIonModal } from "@ionic/react";
import { closeCircleOutline, removeCircleOutline } from "ionicons/icons";
import { AppBadge, AppSearchBar } from "@/components/UI";
import { dayjsFormat } from "@/helpers/formatters";
import FilterModal, { defaultReceiptCheckFilters, ReceiptCheckFilterValues } from "./FilterModal";
import { RECEIPT_CHECK_STATUS } from "@/common/constants/receipt-check.constant";

interface FilterSectionProps {
  searchText: string;
  setSearchText: (text: string) => void;
  filters: ReceiptCheckFilterValues;
  setFilters: React.Dispatch<React.SetStateAction<ReceiptCheckFilterValues>>;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  searchText,
  setSearchText,
  filters,
  setFilters,
}) => {
  const handleDismiss = (data?: ReceiptCheckFilterValues, role?: string) => {
    dismissFilterModal();
    if (role === "confirm" && data) {
      setFilters(data);
    }
  };

  const [presentFilterModal, dismissFilterModal] = useIonModal(FilterModal, {
    dismiss: handleDismiss,
    initialFilters: filters,
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case RECEIPT_CHECK_STATUS.PENDING:
        return "Cần xử lý";
      case RECEIPT_CHECK_STATUS.PROCESSING:
        return "Đang xử lý";
      case RECEIPT_CHECK_STATUS.BALANCING_REQUIRED:
        return "Cần cân đối";
      case RECEIPT_CHECK_STATUS.BALANCED:
        return "Đã cân đối";
      default:
        return "";
    }
  };

  const removeFilter = (key: keyof ReceiptCheckFilterValues) => {
    setFilters((prev) => ({
      ...prev,
      [key]: defaultReceiptCheckFilters[key],
    }));
  };

  const hasActiveFilters =
    filters.status !== defaultReceiptCheckFilters.status ||
    filters.startDate !== defaultReceiptCheckFilters.startDate ||
    filters.endDate !== defaultReceiptCheckFilters.endDate;

  const clearAllFilters = () => {
    setSearchText("");
    setFilters(defaultReceiptCheckFilters);
  };

  const formatFilterDate = (date: string) =>
    date ? dayjsFormat(date, "DD/MM/YYYY") : "...";

  return (
    <div className="mb-2">
      <AppSearchBar
        searchText={searchText}
        setSearchText={setSearchText}
        placeholder="Tìm kiếm phiếu kiểm kho..."
        isFiltered={hasActiveFilters}
        onFilterClick={() => presentFilterModal()}
        extraAction={
          <IonButton
            fill="clear"
            className="h-10 w-10 m-0 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            onClick={clearAllFilters}
            disabled={!searchText && !hasActiveFilters}
            aria-label="Xóa bộ lọc"
            style={{
              '--padding-start': '0px',
              '--padding-end': '0px',
              '--padding-top': '0px',
              '--padding-bottom': '0px',
              '--min-height': '40px',
              '--min-width': '40px',
            }}
          >
            <IonIcon icon={removeCircleOutline} slot="icon-only" className="text-xl" />
          </IonButton>
        }
      />

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="w-full px-4 mt-2 flex flex-wrap gap-2 items-center justify-center">
          {filters.status && (
            <AppBadge
              color="primary"
              variant="soft"
              onClick={() => removeFilter("status")}
              className="flex items-center gap-1 active:opacity-70"
            >
              {getStatusLabel(filters.status)}
              <IonIcon icon={closeCircleOutline} />
            </AppBadge>
          )}

          {(filters.startDate || filters.endDate) && (
            <AppBadge
              color="primary"
              variant="soft"
              onClick={() => {
                removeFilter("startDate");
                removeFilter("endDate");
              }}
              className="flex items-center gap-1 active:opacity-70"
            >
              {formatFilterDate(filters.startDate)} - {formatFilterDate(filters.endDate)}
              <IonIcon icon={closeCircleOutline} />
            </AppBadge>
          )}
        </div>
      )}
    </div>
  );
};
