import React, { useState, useEffect } from "react";
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
} from "@ionic/react";
import useProduct from "@/hooks/apis/useProduct";
import { Toast } from "@capacitor/toast";

interface Props {
  dismiss: (data?: any, role?: string) => void;
  selectedCategories: string[];
}

const CategoriesModal: React.FC<Props> = ({
  dismiss,
  selectedCategories: initialSelected,
}) => {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [searchText, setSearchText] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

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
    const fetchCategories = async () => {
      try {
        const response = await getCategories({ keyword: searchText });

        if (!response.length) {
          return await Toast.show({
            text: "Không tìm thấy kết quả",
            duration: "short",
            position: "top",
          });
        }

        setCategories(response);
      } catch (error) {
        await Toast.show({
          text: (error as Error).message,
          duration: "short",
          position: "top",
        });
      }
    };

    fetchCategories();
  }, [searchText]);

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Chọn nhóm hàng</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => dismiss()}>Đóng</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="p-4">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value || "")}
            debounce={300}
            placeholder="Tìm kiếm nhóm hàng"
            className="mb-4"
          />

          <IonList>
            {categories.map((category) => (
              <IonItem key={category}>
                <IonCheckbox
                  slot="start"
                  checked={selected.includes(category)}
                  onIonChange={() => toggleCategory(category)}
                />
                <IonLabel>{category}</IonLabel>
              </IonItem>
            ))}
          </IonList>
        </div>
      </IonContent>
      <div className="p-4 border-t">
        <IonButton expand="block" onClick={handleConfirm}>
          Áp dụng ({selected.length})
        </IonButton>
      </div>
    </>
  );
};

export default CategoriesModal;
