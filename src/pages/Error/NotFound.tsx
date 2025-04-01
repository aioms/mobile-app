import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonBackButton,
  IonButtons,
} from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";

const NotFound: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
          <IonTitle>Không tìm thấy trang</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-gray-800">404</h1>
            <p className="text-xl mb-8 text-gray-600">Không tìm thấy trang</p>
            <IonButton
              routerLink="/tabs/home"
              routerDirection="none"
              className="w-full"
            >
              <IonIcon icon={arrowBackOutline} slot="start" />
              Trở về trang chủ
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotFound;
