import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonToolbar,
  IonTitle,
  IonFab,
  IonFabButton,
  IonIcon,
} from "@ionic/react";
import { add } from "ionicons/icons";

import ReceiptDebtList from "./ReceiptDebtList";
import OrderList from "./OrderList";

const OrderPage: React.FC = () => {
  const [segment, setSegment] = useState<"orders" | "debt">("orders");

  const handleSegmentChange = (value: "orders" | "debt") => setSegment(value);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Đơn hàng</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Segment Buttons */}
        <IonSegment
          value={segment}
          onIonChange={(e) =>
            handleSegmentChange(e.detail.value as "orders" | "debt")
          }
          className="mb-1"
        >
          <IonSegmentButton value="orders">
            <IonLabel>Đơn hàng</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="debt">
            <IonLabel>Phiếu thu</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {segment === "orders" ? <OrderList /> : <ReceiptDebtList />}

        {/* Floating Action Button */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton routerLink={`/tabs/${segment}/create`}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default OrderPage;
