import { useState } from "react";
import {
  IonContent,
  IonButton,
  IonHeader,
  IonToolbar,
  IonSearchbar,
  IonButtons,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonMenuButton,
} from "@ionic/react";
import { Toast } from "@capacitor/toast";
import { scanOutline, add } from "ionicons/icons";
import posthog from "posthog-js";

import useInventory from "@/hooks/apis/useInventory";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

import ReceiptImportList from "./components/ReceiptImport/ReceiptImportList";
import ReceiptCheckList from "./components/ReceiptCheck/ReceiptCheckList";

const InventoryScreen = () => {
  const [selectedSegment, setSelectedSegment] = useState("receipt-import");
  const [keyword, setKeyword] = useState("");
  const { updateInventoryOfReceiptImport } = useInventory();

  const handleSearch = (e: any) => setKeyword(e.detail.value || "");

  const updateInventory = async (receiptNumber: string) => {
    try {
      if (!receiptNumber) {
        return await Toast.show({
          text: "Không tìm thấy phiếu",
          duration: "short",
          position: "top",
        });
      }

      const response = await updateInventoryOfReceiptImport(receiptNumber);

      await Toast.show({
        text: response.message,
        duration: "short",
        position: "top",
      });
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "long",
        position: "center",
      });
    }
  };

  const handleBarcodeScanned = async (value: string) => {
    posthog?.capture("Update inventory", { property: value });
    stopScan();
    updateInventory(value);
  };

  const handleError = async (error: Error) => {
    await Toast.show({
      text: error.message,
      duration: "long",
      position: "center",
    });
  };

  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: handleError,
  });

  return (
    <IonContent>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton></IonMenuButton>
          </IonButtons>
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

        {selectedSegment === "receipt-import" && (
          <IonToolbar>
            <IonSearchbar
              placeholder="Tìm kiếm..."
              onIonInput={handleSearch}
              className="py-0"
              showClearButton="focus"
            />
            <IonButtons slot="end">
              <IonButton color="primary" onClick={startScan}>
                <IonIcon icon={scanOutline} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        )}
      </IonHeader>

      {selectedSegment === "receipt-import" ? (
        <ReceiptImportList keyword={keyword} />
      ) : (
        <ReceiptCheckList />
      )}

      {selectedSegment === "receipt-import" && (
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
