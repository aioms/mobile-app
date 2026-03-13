import { useState, useEffect } from "react";
import { Toast } from "@capacitor/toast";
import {
  IonList,
  IonRadioGroup,
  IonItem,
  IonRadio,
  IonCheckbox,
  RadioGroupCustomEvent,
} from "@ionic/react";

import useCustomer from "@/hooks/apis/useCustomer";
import ModalCustom from "@/components/Modal/ModalCustom";

type Props = {
  dismiss: (data?: string | string[] | null | undefined | number, role?: string) => void;
  multiple?: boolean;
};

const ModalSelectCustomer: React.FC<Props> = ({ dismiss, multiple = false }) => {
  const [keyword, setKeyword] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

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

  const checkboxChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedValues((prev) => [...prev, value]);
    } else {
      setSelectedValues((prev) => prev.filter((item) => item !== value));
    }
  };

  const handleConfirm = () => {
    if (multiple) {
      dismiss(selectedValues, "confirm");
    } else {
      dismiss(selectedValue, "confirm");
    }
  };

  return (
    <ModalCustom
      title="Chọn khách hàng"
      dismiss={dismiss}
      onSearchChange={handleSearch}
      onConfirm={handleConfirm}
    >
      <IonList>
        {!multiple ? (
          <IonRadioGroup allowEmptySelection onIonChange={selectChange} value={selectedValue}>
            {customers.map((item) => (
              <IonItem key={item.id}>
                <IonRadio
                  slot="start"
                  value={`${item.id}__${item.name}`}
                >
                  {item.name}
                </IonRadio>
              </IonItem>
            ))}
          </IonRadioGroup>
        ) : (
          <>
            {customers.map((item) => {
              const itemValue = `${item.id}__${item.name}`;
              return (
                <IonItem key={item.id}>
                  <IonCheckbox
                    slot="start"
                    checked={selectedValues.includes(itemValue)}
                    onIonChange={(e) => checkboxChange(itemValue, e.detail.checked)}
                  >
                    {item.name}
                  </IonCheckbox>
                </IonItem>
              );
            })}
          </>
        )}
      </IonList>
    </ModalCustom>
  );
};

export default ModalSelectCustomer;
