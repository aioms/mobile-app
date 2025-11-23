import ModalCustom from "@/components/Modal/ModalCustom";
import useSupplier from "@/hooks/apis/useSupplier";
import { useLoading } from "@/hooks";
import {
  IonList,
  IonItem,
  IonCheckbox,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonToast,
  IonLabel,
  IonChip,
  IonRadioGroup,
  IonRadio,
} from "@ionic/react";
import { useEffect, useState, useCallback } from "react";
import type { IModalSelectSupplierProps } from "@/types/supplierModal";

const ModalSelectSupplier: React.FC<IModalSelectSupplierProps> = ({ dismiss, initialSelectedNames = [], multi = false }) => {
  const [keyword, setKeyword] = useState("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  // Store tokens in format `${id}__${name}` for robust ID handling
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedSingle, setSelectedSingle] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  console.log({ initialSelectedNames, multi });

  const { getList: getListSuppliers } = useSupplier();
  const { withLoading } = useLoading();
  const [presentToast] = useIonToast();

  const fetchSuppliers = useCallback(
    async (page: number = 1, append: boolean = false) => {
      const loadFunction = async () => {
        const response = await getListSuppliers(
          {
            keyword,
          },
          page,
          25
        );

        const newSuppliers = response || [];

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
        // For infinite scroll, show loading indicator
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
        // For initial load, use withLoading
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
    const keyword = e.detail.value || "";
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
      const set = new Set(prev);
      if (set.has(token)) {
        set.delete(token);
      } else {
        set.add(token);
      }
      return Array.from(set);
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
      {multi && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedValues.map((token) => {
            const [, name] = token.split("__");
            return (
              <IonChip key={`selected-${token}`} className="bg-blue-50 text-blue-600">
                {name}
              </IonChip>
            );
          })}
        </div>
      )}
      <IonList>
        {multi ? (
          suppliers.map((item, index) => (
            <IonItem
              key={`supplier-${item.id}-${index}`}
              detail={false}
              aria-label={`Chọn nhà cung cấp ${item.name}`}
            >
              <IonLabel>{item.name}</IonLabel>
              <IonCheckbox
                slot="end"
                aria-label={`Nhà cung cấp ${item.name}`}
                checked={selectedValues.includes(`${item.id}__${item.name}`)}
                onIonChange={() => toggleSelection(`${item.id}__${item.name}`)}
              />
            </IonItem>
          ))
        ) : (
          <IonRadioGroup
            value={selectedSingle}
            onIonChange={(e) => handleSingleChange(e.detail.value)}
          >
            {suppliers.map((item, index) => (
              <IonItem key={`supplier-${item.id}-${index}`}>
                <IonRadio value={`${item.id}__${item.name}`}>{item.name}</IonRadio>
              </IonItem>
            ))}
          </IonRadioGroup>
        )}
      </IonList>

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
