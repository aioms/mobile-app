import ModalCustom from "@/components/Modal/ModalCustom";
import useSupplier from "@/hooks/apis/useSupplier";
import { useLoading } from "@/hooks";
import {
  IonList,
  IonRadioGroup,
  IonItem,
  IonRadio,
  RadioGroupCustomEvent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonToast,
} from "@ionic/react";
import { useEffect, useState, useCallback } from "react";

type Props = {
  dismiss: (data?: string | null | undefined | number, role?: string) => void;
};

const ModalSelectSupplier: React.FC<Props> = ({ dismiss }) => {
  const [keyword, setKeyword] = useState("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  const selectChange = (event: RadioGroupCustomEvent) => {
    const { value } = event.detail;
    setSelectedValue(value);
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
      onConfirm={() => dismiss(selectedValue, "confirm")}
    >
      <IonList>
        <IonRadioGroup onIonChange={selectChange}>
          {suppliers.map((item, index) => (
            <IonItem key={`supplier-${item.id}-${index}`}>
              <IonRadio value={`${item.id}__${item.name}`}>
                {item.name}
              </IonRadio>
            </IonItem>
          ))}
        </IonRadioGroup>
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
