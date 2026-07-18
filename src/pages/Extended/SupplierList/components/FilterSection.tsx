import React from "react";
import { IonSearchbar, IonIcon, IonButton } from "@ionic/react";
import { filterOutline } from "ionicons/icons";

interface FilterSectionProps {
  searchText: string;
  setSearchText: (val: string) => void;
  onFilterClick: () => void;
  isFiltered: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  searchText,
  setSearchText,
  onFilterClick,
  isFiltered,
}) => {
  return (
    <div className="px-4 pb-2 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            debounce={800}
            placeholder="Tìm NCC theo tên, danh mục..."
            className="supplier-searchbar p-0"
            mode="md"
          />
        </div>
        <IonButton
          fill="clear"
          className={`h-11 w-11 m-0 --padding-start-0 --padding-end-0 ${
            isFiltered ? "text-primary" : "text-gray-400"
          }`}
          onClick={onFilterClick}
        >
          <IonIcon icon={filterOutline} slot="icon-only" />
        </IonButton>
      </div>

      {/* <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {types.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap ${
              selectedType === type.value
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 active:bg-gray-200"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div> */}
    </div>
  );
};

export default FilterSection;
