import React from "react";
import {
  IonCard,
  IonCardContent,
  IonChip,
  IonIcon,
} from "@ionic/react";
import { calendar, cube } from "ionicons/icons";
import { formatCurrency, formatDate } from "@/helpers/formatters";

interface ItemCardProps {
  item: any;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  return (
    <IonCard routerLink={`/item/${item.id}`} className="mx-4 my-2 shadow-sm">
      <IonCardContent>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">{item.receiptNumber}</h2>
            <IonChip color="primary" className="mr-2">
              {item.status}
            </IonChip>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-primary">
              {formatCurrency(item.totalAmount)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center text-gray-600">
            <IonIcon icon={calendar} className="mr-2" />
            <span className="text-sm">
              {formatDate(item.importDate)}
            </span>
          </div>
          <div className="flex items-center text-gray-600">
            <IonIcon icon={cube} className="mr-2" />
            <span className="text-sm">Qty: {item.quantity}</span>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default ItemCard;
