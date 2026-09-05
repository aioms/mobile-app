import React from "react";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { UserRole } from "@/common/enums/user";
import { useAuth } from "@/hooks";
import CashBookModule from "./components/CashBookModule";
import CustomerModule from "./components/CustomerModule";
import SupplierModule from "./components/SupplierModule";

const ExtendedPage: React.FC = () => {
  const { user } = useAuth();
  const canViewCashBook =
    user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Tính năng mở rộng</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding bg-gray-50">
        {canViewCashBook && <CashBookModule />}
        <CustomerModule />
        <SupplierModule />
      </IonContent>
    </IonPage>
  );
};

export default ExtendedPage;
