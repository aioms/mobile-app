import React, { useState } from 'react';
import { IonIcon, IonActionSheet } from '@ionic/react';
import { searchOutline, optionsOutline, chevronDownOutline, trashOutline } from 'ionicons/icons';

interface FilterSectionProps {
  isFiltered: boolean;
  searchText: string;
  setSearchText: (text: string) => void;
  status: string;
  setStatus: (status: string) => void;
  type: string;
  setType: (type: string) => void;
  onClearFilters: () => void;
  onFilterClick: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  isFiltered,
  searchText,
  setSearchText,
  status,
  setStatus,
  type,
  setType,
  onClearFilters,
  onFilterClick
}) => {
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showTypeSheet, setShowTypeSheet] = useState(false);

  const statusLabels: Record<string, string> = {
    all: "Trạng thái",
    "1": "Đang hoạt động",
    "0": "Ngừng hoạt động",
  };

  const typeLabels: Record<string, string> = {
    all: "Loại khách",
    "1": "Khách lẻ",
    "2": "Doanh nghiệp",
  };

  return (
    <div className="px-4 py-2 bg-white border-b border-gray-100">
      <div className="flex items-center gap-3 mb-4 mt-2">
        <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-3 py-2.5">
          <IonIcon icon={searchOutline} className="text-gray-400 mr-2 text-lg" />
          <input
            type="text"
            placeholder="Tìm kiếm khách hàng..."
            className="bg-transparent border-none outline-none w-full text-[15px] text-gray-700 placeholder-gray-400"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <button
          onClick={onFilterClick}
          className="bg-blue-600 w-[42px] h-[42px] rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform shadow-sm"
        >
          <IonIcon icon={optionsOutline} className="text-white text-xl" />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => {
            setStatus("all");
            setType("all");
          }}
          className={`${status === "all" && type === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-50 text-gray-600"
            } px-5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors`}
        >
          Tất cả
        </button>

        <button
          onClick={() => setShowStatusSheet(true)}
          className={`${status !== "all"
              ? "bg-blue-50 text-blue-600 border border-blue-100"
              : "bg-gray-50 text-gray-600"
            } px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap flex items-center gap-1 active:bg-gray-100 transition-colors`}
        >
          {statusLabels[status]}
          <IonIcon icon={chevronDownOutline} className="text-[10px] ml-0.5" />
        </button>

        <button
          onClick={() => setShowTypeSheet(true)}
          className={`${type !== "all"
              ? "bg-blue-50 text-blue-600 border border-blue-100"
              : "bg-gray-50 text-gray-600"
            } px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap flex items-center gap-1 active:bg-gray-100 transition-colors`}
        >
          {typeLabels[type]}
          <IonIcon icon={chevronDownOutline} className="text-[10px] ml-0.5" />
        </button>

        {isFiltered && (
          <button
            onClick={onClearFilters}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-red-50 text-red-500 rounded-full active:scale-90 transition-transform"
          >
            <IonIcon icon={trashOutline} className="text-lg" />
          </button>
        )}
      </div>

      <IonActionSheet
        isOpen={showStatusSheet}
        onDidDismiss={() => setShowStatusSheet(false)}
        header="Chọn trạng thái"
        buttons={[
          {
            text: 'Tất cả',
            handler: () => setStatus('all'),
          },
          {
            text: 'Đang hoạt động',
            handler: () => setStatus('1'),
          },
          {
            text: 'Ngừng hoạt động',
            handler: () => setStatus('0'),
          },
          {
            text: 'Hủy',
            role: 'cancel',
          },
        ]}
      />

      <IonActionSheet
        isOpen={showTypeSheet}
        onDidDismiss={() => setShowTypeSheet(false)}
        header="Chọn loại khách hàng"
        buttons={[
          {
            text: 'Tất cả',
            handler: () => setType('all'),
          },
          {
            text: 'Khách lẻ',
            handler: () => setType('1'),
          },
          {
            text: 'Doanh nghiệp',
            handler: () => setType('2'),
          },
          {
            text: 'Hủy',
            role: 'cancel',
          },
        ]}
      />
    </div>
  );
};

export default FilterSection;
