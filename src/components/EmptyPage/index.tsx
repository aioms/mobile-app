import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonToolbar,
} from "@ionic/react";
import { alertCircleOutline } from "ionicons/icons";
import { FC } from "react";

type Props = {
  text?: string;
};

const EmptyPage: FC<Props> = ({ text }) => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="flex flex-col items-center justify-center h-full">
          <IonIcon
            icon={alertCircleOutline}
            style={{ fontSize: "64px" }}
            color="medium"
          />
          <IonText color="medium" className="mt-4 text-center">
            {text || "Không tìm thấy thông tin dữ liệu"}
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EmptyPage;
