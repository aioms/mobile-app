import React, { useRef } from "react";
import { Dialog } from "@capacitor/dialog";
import {
  IonChip,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonRippleEffect,
  useIonToast,
} from "@ionic/react";
import { createOutline, trashBinOutline } from "ionicons/icons";

import { dayjsFormat, formatCurrency } from "@/helpers/formatters";
import type { IOrder } from "@/types/order.type";
import { OrderStatus } from "@/common/enums/order";
import {
  getOrderStatusColor,
  getOrderStatusLabel,
  getCustomerTypeColor,
  getCustomerTypeLabel,
} from "@/common/constants/order";
import useOrder from "@/hooks/apis/useOrder";

interface OrderItemProps {
  order: IOrder;
  onCancelOrder?: () => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onCancelOrder }) => {
  const [presentToast] = useIonToast();
  const { update: updateOrder } = useOrder();
  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);

  const handleCancelOrder = async () => {
    try {
      const { value } = await Dialog.confirm({
        title: "Xác nhận hủy đơn hàng",
        message: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      });

      if (!value) return;

      // Close the sliding item
      await slidingRef.current?.close();

      const orderUpdated = await updateOrder(order.id, {
        status: OrderStatus.CANCELLED,
      });

      if (!orderUpdated?.id) {
        throw new Error("Hủy đơn hàng thất bại");
      }

      presentToast({
        message: "Hủy đơn hàng thành công",
        duration: 2000,
        position: "top",
        color: "success",
      });

      onCancelOrder?.();
    } catch (error) {
      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  return (
    <IonItemSliding ref={slidingRef}>
      <IonItem
        lines="full"
        className="order-item ion-activatable ripple-parent rounded-lg shadow-sm mb-3"
        routerLink={`/tabs/orders/detail/${order.id}`}
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
              color={getOrderStatusColor(order.status)}
              className="m-0 font-medium"
            >
              <span className="text-sm italic">
                {getOrderStatusLabel(order.status)}
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
              className={`ml-auto m-0 py-2 ${getCustomerTypeColor(order.customer)} max-w-32`}
            >
              <span className="truncate">
                {getCustomerTypeLabel(order.customer)}
              </span>
            </IonChip>
          </div>
        </div>
        <IonRippleEffect></IonRippleEffect>
      </IonItem>

      {order.status !== OrderStatus.CANCELLED && (
        <IonItemOptions side="end">
          <IonItemOption
            color="tertiary"
            routerLink={`/tabs/orders/update/${order.id}`}
          >
            Sửa đơn
            <IonIcon slot="icon-only" icon={createOutline}></IonIcon>
          </IonItemOption>
          <IonItemOption color="danger" onClick={handleCancelOrder}>
            Hủy đơn
            <IonIcon slot="icon-only" icon={trashBinOutline}></IonIcon>
          </IonItemOption>
        </IonItemOptions>
      )}
    </IonItemSliding>
  );
};

export default OrderItem;
