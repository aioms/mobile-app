import { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonFab,
  IonFabButton,
  IonIcon,
} from "@ionic/react";
import { add } from "ionicons/icons";

import ReceiptImportList from "./components/ReceiptImport/ReceiptImportList";
import ReceiptCheckList from "./components/ReceiptCheck/ReceiptCheckList";

const InventoryScreen = () => {
  const [selectedSegment, setSelectedSegment] = useState("receipt-import");

  return (
    <IonContent>
      <IonHeader>
        <IonToolbar>
          {/* Segment */}
          <IonSegment
            value={selectedSegment}
            onIonChange={(e) => setSelectedSegment(e.detail.value as string)}
          >
            <IonSegmentButton value="receipt-import">
              <IonLabel>Nhập kho</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="receipt-check">
              <IonLabel>Kiểm kho</IonLabel>
            </IonSegmentButton>
          </IonSegment>
          {/* End Segment */}
        </IonToolbar>

        {/* {selectedSegment === "receipt-import" && (
          <IonToolbar>
            <IonSearchbar
              placeholder="Tìm kiếm..."
              onIonInput={handleSearch}
              className="py-0"
              showClearButton="focus"
            />
            <IonButtons slot="end">
              <IonButton color="primary" onClick={() => startScan()}>
                <IonIcon icon={scanOutline} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        )} */}
      </IonHeader>

      {selectedSegment === "receipt-import" ? (
        <ReceiptImportList />
      ) : (
        <ReceiptCheckList />
      )}

      {selectedSegment === "receipt-check" && (
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton routerLink={`/tabs/${selectedSegment}/create`}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      )}
    </IonContent>
  );
};

export default InventoryScreen;
