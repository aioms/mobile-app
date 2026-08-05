import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import { AppFAB, AppSegment } from "@/components/UI";

import ReceiptDebtList from "./ReceiptDebtList";
import OrderList from "./OrderList";

const OrderPage: React.FC = () => {
  const history = useHistory();
  const [segment, setSegment] = useState<"orders" | "debt">("orders");

  const handleSegmentChange = (value: "orders" | "debt") => setSegment(value);

  return (
    <IonPage>
      <IonHeader className="ion-no-border bg-white">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Đơn hàng</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <div className="flex justify-center w-full pb-2 mt-2">
            <AppSegment
              value={segment}
              onIonChange={(value) => handleSegmentChange(value as "orders" | "debt")}
              tabs={[
                { value: "orders", label: "Đơn hàng" },
                { value: "debt", label: "Phiếu thu" },
              ]}
              className="w-full max-w-sm"
            />
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">

        {segment === "orders" ? <OrderList /> : <ReceiptDebtList />}

        <AppFAB onClick={() => history.push(`/tabs/${segment}/create`)} />
      </IonContent>
    </IonPage>
  );
};

export default OrderPage;
