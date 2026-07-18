import React, { FC } from "react";
import {
  IonButtons,
  IonButton,
  IonHeader,
  IonContent,
  IonToolbar,
  IonTitle,
  IonPage,
  IonSearchbar,
} from "@ionic/react";

type Props = {
  title: string;
  data?: any;
  buttonCancelText?: string;
  buttonConfirmText?: string;
  children: React.ReactNode;
  dismiss: (data?: string | null | undefined | number, role?: string) => void;
  onConfirm?: (data: any) => void;
  onSearchChange?: (event: CustomEvent) => void;
  hasConfirmButton?: boolean;
  hasCancelButton?: boolean;
};

const ModalCustom: FC<Props> = ({
  title,
  data,
  buttonCancelText,
  buttonConfirmText,
  hasCancelButton = true,
  hasConfirmButton = true,
  onConfirm,
  onSearchChange,
  dismiss,
  children,
}) => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {hasCancelButton && (
            <IonButtons slot="start">
              <IonButton color="medium" onClick={() => dismiss(null, "cancel")}>
                {buttonCancelText || "Hủy bỏ"}
              </IonButton>
            </IonButtons>
          )}
          <IonTitle>{title}</IonTitle>
          {hasConfirmButton && (
            <IonButtons slot="end">
              <IonButton
                color="primary"
                onClick={() => {
                  if (onConfirm) {
                    onConfirm(data);
                  } else {
                    dismiss(data, "confirm");
                  }
                }}
                strong={true}
              >
                {buttonConfirmText || "Xác nhận"}
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            debounce={800}
            onIonInput={onSearchChange}
          ></IonSearchbar>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">{children}</IonContent>
    </IonPage>
  );
};

export default ModalCustom;
