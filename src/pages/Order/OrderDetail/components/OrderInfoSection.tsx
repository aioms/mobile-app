import React from "react";
import { IonChip, IonLabel } from "@ionic/react";
import { dayjsFormat } from "@/helpers/formatters";
import { getCustomerTypeLabel, getOrderTypeLabel, getOrderTypeColor } from "@/common/constants/order";
import type { ICustomer } from "@/types/order.type";

interface OrderInfoSectionProps {
  orderDate: string;
  customer: ICustomer | null;
  orderType?: string;
  note?: string;
}

const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({
  orderDate,
  customer,
  orderType,
  note,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm mb-4">
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Ngày đặt hàng</span>
          <span>{dayjsFormat(orderDate)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Khách hàng</span>
          <span>{getCustomerTypeLabel(customer)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Loại đơn hàng</span>
          <IonChip
            color={getOrderTypeColor(orderType)}
            className="ion-no-margin"
            style={{ borderRadius: '6px', fontSize: '11px', height: '22px' }}
          >
            <IonLabel>{getOrderTypeLabel(orderType)}</IonLabel>
          </IonChip>
        </div>
        {note && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Ghi chú</span>
            <span>{note}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderInfoSection;
