import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  IonList,
  IonItem,
  IonCheckbox,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonToast,
  IonLabel,
  IonChip,
  IonIcon,
  IonRadioGroup,
  IonRadio,
} from "@ionic/react";
import { closeCircleOutline } from "ionicons/icons";

import ModalCustom from "@/components/Modal/ModalCustom";
import useSupplier from "@/hooks/apis/useSupplier";
import { useLoading } from "@/hooks";
import type { IModalSelectSupplierProps } from "@/types/supplierModal";
import { parseArrayData } from "@/helpers/common";

const LIMIT = 25;

const ModalSelectSupplier: React.FC<IModalSelectSupplierProps> = ({
  dismiss,
  multi = false,
  initialSelectedValues: initialPropsValues = [],
  initialSelectedNames = [],
}) => {
  const [keyword, setKeyword] = useState("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [selectedValues, setSelectedValues] = useState<string[]>(initialPropsValues);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  const { getList: getListSuppliers } = useSupplier();
  const { withLoading } = useLoading();
  const [presentToast] = useIonToast();

  const fetchSuppliers = useCallback(
    async (page: number = 1, append: boolean = false) => {
      const currentRequestId = ++requestIdRef.current;
      const loadFunction = async () => {
        const response = await getListSuppliers(
          {
            keyword,
          },
          page,
          LIMIT
        );

        if (currentRequestId !== requestIdRef.current) return;

        const newSuppliers = parseArrayData(response);

        if (append) {
          // For infinite scroll, append new suppliers
          setSuppliers((prev) => {
            const existingIds = new Set(
              prev.map((supplier: any) => supplier.id)
            );
            const uniqueNewSuppliers = newSuppliers.filter(
              (supplier: any) => !existingIds.has(supplier.id)
            );
            return [...prev, ...uniqueNewSuppliers];
          });
        } else {
          // For initial load or search, replace suppliers
          setSuppliers(newSuppliers);
        }

        // Check if there are more pages
        setHasNextPage(newSuppliers.length === 25);
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
    fetchSuppliers(1, false);
  }, [keyword]);

  const handleSearch = (e: any) => {
    const keyword = e.detail?.value || "";
    setKeyword(keyword);
  };

  // Auto-select existing suppliers in multi mode using {id,name}
  useEffect(() => {
    if (!multi) return;
    if (!initialSelectedNames.length) return;
    setSelectedValues((prev) => {
      const existing = new Set(prev);
      initialSelectedNames.forEach((it) => {
        if (it?.id && it?.name) {
          existing.add(`${it.id}__${it.name}`);
        }
      });
      return Array.from(existing);
    });
  }, [initialSelectedNames, multi]);

  // Single mode preselect (by matching first initial supplier by id/name)
  useEffect(() => {
    if (multi) return;
    if (!suppliers.length || !initialSelectedNames.length) return;
    const match = suppliers.find(
      (s: any) => initialSelectedNames.some((it) => it.id === s.id || it.name === s.name)
    );
    if (match) {
      setSelectedSingle(`${match.id}__${match.name}`);
    }
  }, [suppliers, initialSelectedNames, multi]);

  const toggleSelection = (token: string) => {
    setSelectedValues((prev) => {
      if (prev.includes(token)) {
        return prev.filter((item) => item !== token);
      } else {
        return [...prev, token];
      }
    });
  };

  const handleSingleChange = (value: string) => {
    setSelectedSingle(value);
  };

  const handleInfiniteScroll = async (event: CustomEvent) => {
    if (!hasNextPage || isLoadingMore) {
      (event.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    await fetchSuppliers(nextPage, true);

    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  return (
    <ModalCustom
      title="Nhà cung cấp"
      dismiss={dismiss}
      onSearchChange={handleSearch}
      onConfirm={() => {
        if (multi) {
          if (!selectedValues.length) {
            presentToast({
              message: "Vui lòng chọn ít nhất một nhà cung cấp",
              duration: 2000,
              position: "top",
              color: "warning",
            });
            return;
          }
          dismiss(selectedValues, "confirm");
        } else {
          dismiss(selectedSingle, "confirm");
        }
      }}
    >
      {/* Selected suppliers display (multi mode) */}
      {multi && selectedValues.length > 0 && (
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
        {multi ? (
          suppliers.map((item, index) => {
            const itemValue = `${item.id}__${item.name}`;
            const isChecked = selectedValues.includes(itemValue);
            return (
              <IonItem
                key={`supplier-${item.id}-${index}`}
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
                  aria-label={`Nhà cung cấp ${item.name}`}
                  className="pointer-events-none"
                />
              </IonItem>
            );
          })
        ) : (
          <IonRadioGroup
            value={selectedSingle}
            onIonChange={(e) => handleSingleChange(e.detail.value)}
          >
            {suppliers.map((item, index) => {
              const itemValue = `${item.id}__${item.name}`;
              return (
                <IonItem
                  key={`supplier-${item.id}-${index}`}
                  button
                  detail={false}
                  onClick={() => handleSingleChange(itemValue)}
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
                  <IonRadio slot="end" value={itemValue} aria-label={`Nhà cung cấp ${item.name}`} />
                </IonItem>
              );
            })}
          </IonRadioGroup>
        )}
      </IonList>

      {/* Empty State */}
      {!suppliers.length && (
        <div className="py-12 text-center text-gray-500">
          <p className="text-sm font-medium">Không tìm thấy nhà cung cấp phù hợp</p>
        </div>
      )}

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

export default ModalSelectSupplier;
