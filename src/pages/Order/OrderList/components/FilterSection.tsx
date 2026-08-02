import React, { useEffect, useState } from "react";
import { IonButton, IonIcon, useIonModal } from "@ionic/react";
import { removeCircleOutline } from "ionicons/icons";
import { AppSearchBar } from "@/components/UI";
import FilterModal, { OrderFilterValues, defaultOrderFilters } from "./FilterModal";

interface FilterSectionProps {
  onFilterChange: (filters: Record<string, string>) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ onFilterChange }) => {
  const [keyword, setKeyword] = useState("");
  const [filterValues, setFilterValues] = useState<OrderFilterValues>(defaultOrderFilters);

  const [presentFilter, dismissFilter] = useIonModal(FilterModal, {
    dismiss: (data: OrderFilterValues, role: string) => dismissFilter(data, role),
    initialFilters: filterValues,
  });

  const openFilterModal = () => {
    presentFilter({
      onWillDismiss: (ev: CustomEvent) => {
        if (ev.detail.role === "confirm") {
          const newFilters: OrderFilterValues = ev.detail.data || defaultOrderFilters;
          setFilterValues(newFilters);
        }
      },
    });
  };

  useEffect(() => {
    const filters: Record<string, string> = {};

    if (keyword) filters.keyword = keyword;
    if (filterValues.status) filters.status = filterValues.status;
    if (filterValues.startDate) filters.startDate = filterValues.startDate;
    if (filterValues.endDate) filters.endDate = filterValues.endDate;
    if (filterValues.customerId) filters.customerId = filterValues.customerId;

    onFilterChange(filters);
  }, [keyword, filterValues]);

  const handleClearFilters = () => {
    setKeyword("");
    setFilterValues(defaultOrderFilters);
  };

  const isFiltered =
    !!filterValues.status ||
    !!filterValues.startDate ||
    !!filterValues.endDate ||
    !!filterValues.customerId;

  return (
    <div className="mb-2">
      <AppSearchBar
        searchText={keyword}
        setSearchText={setKeyword}
        placeholder="Tìm kiếm đơn hàng..."
        isFiltered={isFiltered}
        onFilterClick={openFilterModal}
        extraAction={
          <IonButton
            fill="clear"
            className="h-10 w-10 m-0 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            onClick={handleClearFilters}
            disabled={!keyword && !isFiltered}
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
    </div>
  );
};

export default FilterSection;
