import React from "react";
import {
  IonChip,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonRippleEffect,
} from "@ionic/react";
import { createOutline, trashBinOutline } from "ionicons/icons";

import { dayjsFormat, formatCurrency } from "@/helpers/formatters";
import { CustomerType, OrderStatus } from "@/common/enums/order";
import type { IOrder } from "@/types/order.type";

interface OrderItemProps {
  order: IOrder;
}
const getStatusLabel = (status: string): string => {
  switch (status) {
    case OrderStatus.PENDING:
      return "Chờ thanh toán";
    case OrderStatus.PAID:
      return "Đã thanh toán";
    case OrderStatus.CANCELLED:
      return "Đã hủy";
    default:
      return "Không xác định";
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case OrderStatus.PENDING:
      return "warning";
    case OrderStatus.PAID:
      return "success";
    case OrderStatus.CANCELLED:
      return "danger";
    default:
      return "medium";
  }
};

const getCustomerTypeLabel = (type: string): string => {
  return type === CustomerType.LOYAL ? "Khách sỉ" : "Khách lẻ";
};

const getCustomerTypeColor = (type: string): string => {
  return type === CustomerType.LOYAL
    ? "bg-blue-100 text-blue-700"
    : "bg-orange-100 text-orange-700";
};

const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
  return (
    <IonItemSliding>
      <IonItem
        lines="full"
        className="order-item ion-activatable ripple-parent rounded-lg shadow-sm mb-3"
        routerLink={`/tabs/order/detail/${order.id}`}
      >
        <div className="py-4 w-full">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sky-400 font-medium text-sm mr-2">
              Mã đơn: #{order.code}
            </div>
            <div className="text-gray-600 text-sm">
              {dayjsFormat(order.createdAt)}
            </div>
          </div>

          <div className="flex items-center mb-2">
            <IonChip
              color={getStatusColor(order.status)}
              className="m-0 font-medium"
            >
              <span className="text-sm italic">
                {getStatusLabel(order.status)}
              </span>
            </IonChip>
          </div>

          <div className="flex items-center">
            <div className="text-gray-600 mr-2">
              Số mặt hàng: {order.items?.length}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-green-500 font-medium">
              Tổng tiền: {formatCurrency(order.totalAmount)}
            </div>
            <IonChip
              className={`ml-auto m-0 ${getCustomerTypeColor(
                order.customerType
              )}`}
            >
              {getCustomerTypeLabel(order.customerType)}
            </IonChip>
          </div>
        </div>
        <IonRippleEffect></IonRippleEffect>
      </IonItem>

      <IonItemOptions side="end">
        <IonItemOption color="tertiary">
          Sửa đơn
          <IonIcon slot="icon-only" icon={createOutline}></IonIcon>
        </IonItemOption>
        <IonItemOption color="danger">
          Hủy đơn
          <IonIcon slot="icon-only" icon={trashBinOutline}></IonIcon>
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default OrderItem;
