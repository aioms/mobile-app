import React from 'react';
import { IonSearchbar, IonIcon, IonButton } from '@ionic/react';
import { filterOutline } from 'ionicons/icons';

interface AppSearchBarProps {
  searchText: string;
  setSearchText: (val: string) => void;
  onFilterClick?: () => void;
  isFiltered?: boolean;
  placeholder?: string;
  showFilter?: boolean;
  extraAction?: React.ReactNode;
}

const AppSearchBar: React.FC<AppSearchBarProps> = ({
  searchText,
  setSearchText,
  onFilterClick,
  isFiltered = false,
  placeholder = 'Tìm kiếm...',
  showFilter = true,
  extraAction,
}) => {
  return (
    <div className="w-full px-4 py-2 bg-white flex items-center justify-between gap-2 border-b border-gray-100">
      <div className="flex-1 min-w-0 flex items-center">
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value!)}
          debounce={500}
          placeholder={placeholder}
          className="custom-app-searchbar p-0 m-0 w-full"
          mode="md"
        />
      </div>
      {showFilter && (
        <IonButton
          fill="clear"
          className={`h-10 w-10 m-0 flex-shrink-0 flex items-center justify-center rounded-xl transition-colors ${
            isFiltered
              ? 'text-primary bg-blue-50 border border-blue-100'
              : 'text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={onFilterClick}
          style={{
            '--padding-start': '0px',
            '--padding-end': '0px',
            '--padding-top': '0px',
            '--padding-bottom': '0px',
            '--min-height': '40px',
            '--min-width': '40px',
          }}
        >
          <IonIcon icon={filterOutline} slot="icon-only" className="text-xl" />
        </IonButton>
      )}
      {extraAction}
    </div>
  );
};

export default AppSearchBar;
