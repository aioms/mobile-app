import { useState, useEffect } from "react";
import { Toast } from "@capacitor/toast";
import {
  IonList,
  IonRadioGroup,
  IonItem,
  IonRadio,
  RadioGroupCustomEvent,
} from "@ionic/react";

import useCustomer from "@/hooks/apis/useCustomer";
import ModalCustom from "@/components/Modal/ModalCustom";

type Props = {
  dismiss: (data?: string | null | undefined | number, role?: string) => void;
};

const ModalSelectCustomer: React.FC<Props> = ({ dismiss }) => {
  const [keyword, setKeyword] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");

  const { getList: getListCustomers } = useCustomer();

  const fetchCustomers = async () => {
    try {
      const response = await getListCustomers(
        {
          keyword,
        },
        1,
        25
      );

      setCustomers(response || []);
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    }
  };

  useEffect(() => {
    fetchCustomers();
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
      title="Chọn khách hàng"
      dismiss={dismiss}
      onSearchChange={handleSearch}
      onConfirm={() => dismiss(selectedValue, "confirm")}
    >
      <IonList>
        <IonRadioGroup allowEmptySelection onIonChange={selectChange}>
          {/* Show "Khách lẻ" only when no keyword or when keyword matches */}
          {/* {(!keyword ||
            "Khách lẻ".toLowerCase().includes(keyword.toLowerCase())) && (
            <IonItem>
              <IonRadio
                key="individual"
                slot="start"
                value="individual__Khách lẻ"
              >
                Khách lẻ
              </IonRadio>
            </IonItem>
          )} */}
          {customers.map((item) => (
            <IonItem>
              <IonRadio
                slot="start"
                key={item.id}
                value={`${item.id}__${item.name}`}
              >
                {item.name}
              </IonRadio>
            </IonItem>
          ))}
        </IonRadioGroup>
      </IonList>
    </ModalCustom>
  );
};

export default ModalSelectCustomer;
