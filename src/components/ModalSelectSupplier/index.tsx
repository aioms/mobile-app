import ModalCustom from "@/components/Modal/ModalCustom";
import useSupplier from "@/hooks/apis/useSupplier";
import { Toast } from "@capacitor/toast";
import {
  IonList,
  IonRadioGroup,
  IonItem,
  IonRadio,
  RadioGroupCustomEvent,
} from "@ionic/react";
import { useEffect, useState } from "react";

type Props = {
  dismiss: (data?: string | null | undefined | number, role?: string) => void;
};

const ModalSelectSupplier: React.FC<Props> = ({ dismiss }) => {
  const [keyword, setKeyword] = useState("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");

  const { getList: getListSuppliers } = useSupplier();

  const fetchSuppliers = async () => {
    try {
      const response = await getListSuppliers(
        {
          keyword,
        },
        1,
        25
      );

      setSuppliers(response || []);
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [keyword]);

  const handleSearch = (e: any) => {
    const keyword = e.detail.value || "";
    setKeyword(keyword);
  };

  const selectChange = (event: RadioGroupCustomEvent) => {
    const { value } = event.detail;
    setSelectedValue(value);
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
          {suppliers.map((item) => (
            <IonItem>
              <IonRadio key={item.id} value={`${item.id}__${item.name}`}>
                {item.name}
              </IonRadio>
            </IonItem>
          ))}
        </IonRadioGroup>
      </IonList>
    </ModalCustom>
  );
};

export default ModalSelectSupplier;
