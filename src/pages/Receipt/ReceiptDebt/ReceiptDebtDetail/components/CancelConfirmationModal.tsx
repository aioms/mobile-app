import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonTextarea,
  IonItem,
  IonLabel,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";

interface CancelConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  isLoading?: boolean;
  receiptCode?: string;
}

const CancelConfirmationModal: React.FC<CancelConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  receiptCode,
}) => {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note);
    setNote("");
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Xác nhận hủy phiếu</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} disabled={isLoading}>
              Đóng
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Bạn có chắc chắn muốn hủy phiếu thu{" "}
            <span className="font-semibold text-gray-800">{receiptCode}</span>?
          </p>
          <p className="text-sm text-gray-500">
            Hành động này không thể hoàn tác. Phiếu thu sẽ được đánh dấu là đã hủy.
          </p>
        </div>

        <IonItem className="mb-4">
          <IonLabel position="stacked">Lý do hủy (tùy chọn)</IonLabel>
          <IonTextarea
            value={note}
            onIonChange={(e) => setNote(e.detail.value || "")}
            placeholder="Nhập lý do hủy phiếu thu..."
            rows={3}
            disabled={isLoading}
          />
        </IonItem>

        <IonGrid>
          <IonRow>
            <IonCol>
              <IonButton
                expand="block"
                color="medium"
                onClick={handleClose}
                disabled={isLoading}
              >
                Quay lại
              </IonButton>
            </IonCol>
            <IonCol>
              <IonButton
                expand="block"
                color="danger"
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? "Đang xử lý..." : "Xác nhận hủy"}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default CancelConfirmationModal;