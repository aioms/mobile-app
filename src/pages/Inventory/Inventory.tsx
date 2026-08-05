import { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonPage,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import { AppFAB, AppSegment } from "@/components/UI";

import ReceiptImportList from "./components/ReceiptImport/ReceiptImportList";
import ReceiptCheckList from "./components/ReceiptCheck/ReceiptCheckList";

const InventoryScreen = () => {
  const history = useHistory();
  const [selectedSegment, setSelectedSegment] = useState("receipt-import");

  return (
    <IonPage>
      <IonHeader className="ion-no-border bg-white">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Kho hàng</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <div className="flex justify-center w-full pb-2 mt-2">
            <AppSegment
              value={selectedSegment}
              onIonChange={setSelectedSegment}
              tabs={[
                { value: "receipt-import", label: "Nhập kho" },
                { value: "receipt-check", label: "Kiểm kho" },
              ]}
              className="w-full max-w-sm"
            />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-gray-50">
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
      {selectedSegment === "receipt-import" ? (
        <ReceiptImportList />
      ) : (
        <ReceiptCheckList />
      )}

      {selectedSegment === "receipt-check" && (
        <AppFAB onClick={() => {
          history.push(`/tabs/${selectedSegment}/create`);
        }} />
      )}
    </IonContent>
    </IonPage>
  );
};

export default InventoryScreen;
