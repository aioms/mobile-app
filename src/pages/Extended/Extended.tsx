import React from "react";
import { IonContent } from "@ionic/react";
import CustomerModule from "./components/CustomerModule";
import SupplierModule from "./components/SupplierModule";

const ExtendedPage: React.FC = () => {
  return (
    <IonContent className="ion-padding bg-gray-50">
      <CustomerModule />
      <SupplierModule />
    </IonContent>
  );
};

export default ExtendedPage;
