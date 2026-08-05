import React from "react";
import { AppSearchBar } from "@/components/UI";

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
    <AppSearchBar
      searchText={searchText}
      setSearchText={setSearchText}
      placeholder="Tìm NCC theo tên, danh mục..."
      isFiltered={isFiltered}
      onFilterClick={onFilterClick}
    />
  );
};

export default FilterSection;
