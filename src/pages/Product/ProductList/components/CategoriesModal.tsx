import React, { useState, useEffect, useRef } from "react";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonSearchbar,
  IonChip,
  IonIcon,
} from "@ionic/react";
import { closeCircleOutline } from "ionicons/icons";
import useProduct from "@/hooks/apis/useProduct";
import { Toast } from "@capacitor/toast";

import { parseArrayData } from "@/helpers/common";

interface Props {
  dismiss: (data?: string[], role?: string) => void;
  selectedCategories?: string[];
  initialSelected?: string[];
}

const CategoriesModal: React.FC<Props> = ({
  dismiss,
  selectedCategories = [],
  initialSelected = [],
}) => {
  const [selected, setSelected] = useState<string[]>(selectedCategories.length > 0 ? selectedCategories : initialSelected);
  const [searchText, setSearchText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const keywordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { getCategories } = useProduct();

  const handleConfirm = () => {
    dismiss(selected, "confirm");
  };

  const toggleCategory = (category: string) => {
    setSelected((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  useEffect(() => {
    if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);
    keywordTimerRef.current = setTimeout(() => {
      setSearchKeyword(searchText);
    }, 500);
    return () => {
      if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);
    };
  }, [searchText]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories({ keyword: searchKeyword });
        const list = parseArrayData<string>(response);

        if (!list.length) {
          setCategories([]);
          return await Toast.show({
            text: "Không tìm thấy kết quả",
            duration: "short",
            position: "top",
          });
        }

        setCategories(list);
      } catch (error) {
        setCategories([]);
        await Toast.show({
          text: (error as Error).message || "Có lỗi xảy ra",
          duration: "short",
          position: "top",
        });
      }
    };

    fetchCategories();
  }, [searchKeyword]);

  return (
    <>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonTitle>Chọn nhóm hàng</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => dismiss()}>Đóng</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <div className="p-4">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value || "")}
            debounce={0}
            placeholder="Tìm kiếm nhóm hàng..."
            className="mb-3"
          />

          {/* Selected chips bar */}
          {selected.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
              {selected.map((category) => (
                <IonChip
                  key={`selected-${category}`}
                  className="m-0 bg-blue-100 text-blue-800 text-xs py-1 px-2.5 font-medium flex items-center gap-1 cursor-pointer"
                  onClick={() => toggleCategory(category)}
                >
                  <IonLabel>{category}</IonLabel>
                  <IonIcon icon={closeCircleOutline} className="text-blue-600 text-sm" />
                </IonChip>
              ))}
            </div>
          )}

          <IonList lines="full" className="rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white">
            {categories.map((category) => {
              const isChecked = selected.includes(category);
              return (
                <IonItem
                  key={category}
                  button
                  detail={false}
                  onClick={() => toggleCategory(category)}
                  className="--min-height-48 cursor-pointer"
                >
                  <IonLabel className="py-2">
                    <div className="font-medium text-gray-900">{category}</div>
                  </IonLabel>
                  <IonCheckbox
                    slot="end"
                    checked={isChecked}
                    aria-label={category}
                    className="pointer-events-none"
                  />
                </IonItem>
              );
            })}
          </IonList>
        </div>
      </IonContent>

      <div className="p-4 border-t bg-white">
        <IonButton expand="block" onClick={handleConfirm} color="primary">
          Áp dụng ({selected.length})
        </IonButton>
      </div>
    </>
  );
};

export default CategoriesModal;
