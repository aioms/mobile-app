import React, { useEffect, useRef, useState } from 'react';
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
  /** Debounce parent notify only. IonSearchbar always uses debounce={0} to avoid controlled-value race. */
  debounceMs?: number;
}

const AppSearchBar: React.FC<AppSearchBarProps> = ({
  searchText,
  setSearchText,
  onFilterClick,
  isFiltered = false,
  placeholder = 'Tìm kiếm...',
  showFilter = true,
  extraAction,
  debounceMs = 500,
}) => {
  // Local display value updates on every keystroke so controlled `value` never lags behind typing.
  const [localText, setLocalText] = useState(searchText);
  const lastNotifiedRef = useRef(searchText);
  const notifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from parent when cleared/reset externally (not from our own notify).
  useEffect(() => {
    if (searchText !== lastNotifiedRef.current) {
      if (notifyTimerRef.current) {
        clearTimeout(notifyTimerRef.current);
        notifyTimerRef.current = null;
      }
      setLocalText(searchText);
      lastNotifiedRef.current = searchText;
    }
  }, [searchText]);

  useEffect(() => {
    return () => {
      if (notifyTimerRef.current) clearTimeout(notifyTimerRef.current);
    };
  }, []);

  const notifyParent = (val: string) => {
    if (debounceMs <= 0) {
      lastNotifiedRef.current = val;
      setSearchText(val);
      return;
    }
    if (notifyTimerRef.current) clearTimeout(notifyTimerRef.current);
    notifyTimerRef.current = setTimeout(() => {
      lastNotifiedRef.current = val;
      setSearchText(val);
      notifyTimerRef.current = null;
    }, debounceMs);
  };

  return (
    <div className="w-full px-4 py-2 bg-white flex items-center justify-between gap-2 border-b border-gray-100">
      <div className="flex-1 min-w-0 flex items-center">
        <IonSearchbar
          value={localText}
          onIonInput={(e) => {
            const next = e.detail.value ?? '';
            setLocalText(next);
            notifyParent(next);
          }}
          debounce={0}
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
