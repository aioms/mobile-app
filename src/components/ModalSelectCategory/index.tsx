import React, { useCallback, useEffect, useState, useRef } from "react";
import ModalCustom from "@/components/Modal/ModalCustom";
import { useLoading } from "@/hooks";
import useProduct from "@/hooks/apis/useProduct";
import { parseArrayData } from "@/helpers/common";
import {
  IonList,
  IonRadioGroup,
  IonItem,
  IonRadio,
  IonLabel,
  RadioGroupCustomEvent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonToast,
} from "@ionic/react";

import type { IModalSelectCategoryProps } from "@/types/categoryModal";

const LIMIT = 25;

const ModalSelectCategory: React.FC<IModalSelectCategoryProps> = ({ dismiss }) => {
  const [keyword, setKeyword] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  const { getCategories } = useProduct();
  const { withLoading } = useLoading();
  const [presentToast] = useIonToast();

  const fetchCategories = useCallback(
    async (page: number = 1, append: boolean = false) => {
      const currentRequestId = ++requestIdRef.current;
      const loadFunction = async () => {
        const response = await getCategories({ keyword }, page, LIMIT);
        if (currentRequestId !== requestIdRef.current) return;

        const newCategories = parseArrayData<string>(response);

        if (append) {
          setCategories((prev) => {
            const existing = new Set(prev);
            const uniqueNew = newCategories.filter((c) => !existing.has(c));
            return [...prev, ...uniqueNew];
          });
        } else {
          setCategories(newCategories);
        }

        setHasNextPage(newCategories.length === LIMIT);
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
    fetchCategories(1, false);
  }, [keyword]);

  const handleSearch = (e: CustomEvent) => {
    const kw = (e as any).detail?.value || "";
    setKeyword(kw);
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
    await fetchCategories(nextPage, true);
    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  return (
    <ModalCustom
      title="Nhóm hàng"
      dismiss={dismiss}
      onSearchChange={handleSearch}
      onConfirm={() => dismiss(selectedValue, "confirm")}
    >
      <IonList lines="full" className="rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white">
        <IonRadioGroup value={selectedValue} onIonChange={selectChange}>
          {categories.map((item, index) => (
            <IonItem
              key={`category-${index}`}
              button
              detail={false}
              onClick={() => setSelectedValue(item)}
              className="--min-height-48 cursor-pointer"
            >
              <IonLabel className="py-2">
                <div className="font-medium text-gray-900">{item}</div>
              </IonLabel>
              <IonRadio slot="end" value={item} aria-label={item} />
            </IonItem>
          ))}
        </IonRadioGroup>
      </IonList>

      {/* Empty State */}
      {!categories.length && (
        <div className="py-12 text-center text-gray-500">
          <p className="text-sm font-medium">Không tìm thấy nhóm hàng phù hợp</p>
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

export default ModalSelectCategory;