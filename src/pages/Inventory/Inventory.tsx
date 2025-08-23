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
} from "@ionic/react";
import { Toast } from "@capacitor/toast";
import { scanOutline, add } from "ionicons/icons";
import { useHistory } from "react-router";

import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import useReceiptImport from "@/hooks/apis/useReceiptImport";

import ReceiptImportList from "./components/ReceiptImport/ReceiptImportList";
import ReceiptCheckList from "./components/ReceiptCheck/ReceiptCheckList";

const InventoryScreen = () => {
  const history = useHistory();
  const [selectedSegment, setSelectedSegment] = useState("receipt-import");
  const [keyword, setKeyword] = useState("");

  const { importQuick } = useReceiptImport();

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

      const response = await importQuick({ code: receiptNumber });
      const receiptId = response?.id;

      if (!receiptId) {
        throw new Error("Cập nhật thất bại");
      }

      history.push(`/tabs/receipt-import/detail/${receiptId}`);
      await Toast.show({
        text: 'Cập nhật thành công',
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
              <IonButton color="primary" onClick={() => startScan()}>
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
