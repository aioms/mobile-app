import React, { useState, useEffect, useCallback } from "react";
import {
  IonList,
  IonRadioGroup,
  IonItem,
  IonRadio,
  IonCheckbox,
  IonLabel,
  IonChip,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonToast,
  RadioGroupCustomEvent,
} from "@ionic/react";
import { closeCircleOutline } from "ionicons/icons";

import useCustomer from "@/hooks/apis/useCustomer";
import { useLoading } from "@/hooks";
import { parseArrayData } from "@/helpers/common";
import { useRef } from "react";
import ModalCustom from "@/components/Modal/ModalCustom";

export interface IModalSelectCustomerProps {
  dismiss: (data?: string | string[] | null | undefined | number, role?: string) => void;
  multiple?: boolean;
  initialSelectedValue?: string;
  initialSelectedValues?: string[];
  allowRetailCustomer?: boolean;
}

const LIMIT = 25;

const ModalSelectCustomer: React.FC<IModalSelectCustomerProps> = ({
  dismiss,
  multiple = false,
  initialSelectedValue = "",
  initialSelectedValues = [],
  allowRetailCustomer = true,
}) => {
  const [keyword, setKeyword] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>(initialSelectedValue);
  const [selectedValues, setSelectedValues] = useState<string[]>(initialSelectedValues);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  const { getList: getListCustomers } = useCustomer();
  const { withLoading } = useLoading();
  const [presentToast] = useIonToast();

  const fetchCustomers = useCallback(
    async (page: number = 1, append: boolean = false) => {
      const currentRequestId = ++requestIdRef.current;
      const loadFunction = async () => {
        const response = await getListCustomers(
          {
            keyword,
          },
          page,
          LIMIT
        );

        if (currentRequestId !== requestIdRef.current) return;

        const newCustomers = parseArrayData(response);

        if (append) {
          setCustomers((prev) => {
            const existingIds = new Set(prev.map((c: any) => c.id));
            const uniqueNew = newCustomers.filter((c: any) => !existingIds.has(c.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setCustomers(newCustomers);
        }

        setHasNextPage(newCustomers.length === LIMIT);
      };

      if (append) {
        setIsLoadingMore(true);
        try {
          await loadFunction();
        } catch (error) {
          await presentToast({
            message: (error as Error).message,
            duration: 2000,
            position: "top",
            color: "danger",
          });
        } finally {
          setIsLoadingMore(false);
        }
      } else {
        await withLoading(loadFunction);
      }
    },
    [keyword]
  );

  useEffect(() => {
    setCurrentPage(1);
    setHasNextPage(true);
    fetchCustomers(1, false);
  }, [keyword]);

  const handleSearch = (e: CustomEvent) => {
    const kw = (e.detail?.value || "").trim();
    setKeyword(kw);
  };

  const selectChange = (event: RadioGroupCustomEvent) => {
    const { value } = event.detail;
    setSelectedValue(value);
  };

  const toggleSelection = (token: string) => {
    setSelectedValues((prev) => {
      if (prev.includes(token)) {
        return prev.filter((item) => item !== token);
      } else {
        return [...prev, token];
      }
    });
  };

  const handleConfirm = () => {
    if (multiple) {
      dismiss(selectedValues, "confirm");
    } else {
      dismiss(selectedValue, "confirm");
    }
  };

  const handleInfiniteScroll = async (event: CustomEvent) => {
    if (!hasNextPage || isLoadingMore) {
      (event.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchCustomers(nextPage, true);
    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  // Check if "Khách lẻ" should be displayed in search results
  const showRetailCustomer =
    !multiple &&
    allowRetailCustomer &&
    (!keyword || "khách lẻ".includes(keyword.toLowerCase()));

  return (
    <ModalCustom
      title="Chọn khách hàng"
      dismiss={dismiss}
      onSearchChange={handleSearch}
      onConfirm={handleConfirm}
    >
      {/* Multi-select chips */}
      {multiple && selectedValues.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
          {selectedValues.map((token) => {
            const parts = token.split("__");
            const name = parts[1] || parts[0];
            return (
              <IonChip
                key={`selected-${token}`}
                className="m-0 bg-blue-100 text-blue-800 text-xs py-1 px-2.5 font-medium flex items-center gap-1 cursor-pointer"
                onClick={() => toggleSelection(token)}
              >
                <IonLabel>{name}</IonLabel>
                <IonIcon icon={closeCircleOutline} className="text-blue-600 text-sm" />
              </IonChip>
            );
          })}
        </div>
      )}

      <IonList lines="full" className="rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white">
        {!multiple ? (
          <IonRadioGroup
            allowEmptySelection
            onIonChange={selectChange}
            value={selectedValue}
          >
            {showRetailCustomer && (
              <IonItem
                button
                detail={false}
                onClick={() => setSelectedValue("individual__Khách lẻ")}
                className="--min-height-48 cursor-pointer"
              >
                <IonLabel className="py-2">
                  <div className="font-medium text-gray-900">Khách lẻ</div>
                </IonLabel>
                <IonRadio
                  slot="end"
                  value="individual__Khách lẻ"
                  aria-label="Khách lẻ"
                />
              </IonItem>
            )}

            {customers.map((item) => {
              const itemValue = `${item.id}__${item.name}`;
              return (
                <IonItem
                  key={item.id}
                  button
                  detail={false}
                  onClick={() => setSelectedValue(itemValue)}
                  className="--min-height-48 cursor-pointer"
                >
                  <IonLabel className="py-2">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {(item.phone || item.code) && (
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                        {item.phone && <span>{item.phone}</span>}
                        {item.code && <span>• {item.code}</span>}
                      </div>
                    )}
                  </IonLabel>
                  <IonRadio slot="end" value={itemValue} aria-label={item.name} />
                </IonItem>
              );
            })}
          </IonRadioGroup>
        ) : (
          <>
            {customers.map((item) => {
              const itemValue = `${item.id}__${item.name}`;
              const isChecked = selectedValues.includes(itemValue);
              return (
                <IonItem
                  key={item.id}
                  button
                  detail={false}
                  onClick={() => toggleSelection(itemValue)}
                  className="--min-height-48 cursor-pointer"
                >
                  <IonLabel className="py-2">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {(item.phone || item.code) && (
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                        {item.phone && <span>{item.phone}</span>}
                        {item.code && <span>• {item.code}</span>}
                      </div>
                    )}
                  </IonLabel>
                  <IonCheckbox
                    slot="end"
                    checked={isChecked}
                    aria-label={item.name}
                    className="pointer-events-none"
                  />
                </IonItem>
              );
            })}
          </>
        )}
      </IonList>

      {/* Empty State */}
      {!customers.length && !showRetailCustomer && (
        <div className="py-12 text-center text-gray-500">
          <p className="text-sm font-medium">Không tìm thấy khách hàng phù hợp</p>
        </div>
      )}

      {/* Infinite Scroll */}
      <IonInfiniteScroll
        threshold="100px"
        disabled={!hasNextPage}
        onIonInfinite={handleInfiniteScroll}
      >
        <IonInfiniteScrollContent
          loadingSpinner="crescent"
          loadingText="Đang tải thêm..."
        />
      </IonInfiniteScroll>
    </ModalCustom>
  );
};

export default ModalSelectCustomer;
