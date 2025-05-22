import React from "react";
import {
  IonContent,
  IonPage,
  IonFab,
  IonFabButton,
  IonIcon,
} from "@ionic/react";
import { add } from "ionicons/icons";
import TransactionItemList from "./components/TransactionItemList";

const TransactionScreen: React.FC = () => {
  // Mock items data - replace with actual data fetching
  const items: any[] = [
    {
      id: 1,
      receiptNumber: "RCP-2024-001",
      importDate: "2024-03-25",
      quantity: 150,
      status: "Pending",
      totalAmount: 4500.0,
    },
    {
      id: 2,
      receiptNumber: "RCP-2024-002",
      importDate: "2024-03-20",
      quantity: 75,
      status: "In Transit",
      totalAmount: 2250.0,
    },
    {
      id: 3,
      receiptNumber: "RCP-2024-003",
      importDate: "2024-03-15",
      quantity: 200,
      status: "Delivered",
      totalAmount: 6000.0,
    },
    {
      id: 4,
      receiptNumber: "RCP-2024-004",
      importDate: "2024-03-10",
      quantity: 50,
      status: "Cancelled",
      totalAmount: 1500.0,
    },
  ];

  // const handleSearch = (query: string) => {
  //   setSearchQuery(query);
  // };

  // const handleScan = () => {
  //   console.log("Scanning barcode...");
  // };

  return (
    <IonContent>
      <TransactionItemList items={items} />

      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton routerLink="/new-item">
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>
    </IonContent>
  );
};

export default TransactionScreen;
