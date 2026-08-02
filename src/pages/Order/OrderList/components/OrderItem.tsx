import React, { useMemo, useRef } from "react";
import { Dialog } from "@capacitor/dialog";
import {
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonRippleEffect,
  useIonToast,
  useIonViewDidLeave,
} from "@ionic/react";
import { AppBadge } from "@/components/UI";
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

  const isOrderPaid = useMemo(() => {
    return order.status === OrderStatus.COMPLETED;
  }, [order.status]);

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

  useIonViewDidLeave(() => {
    slidingRef.current?.close();
  });

  return (
    <IonItemSliding ref={slidingRef}>
      <IonItem
        lines="none"
        className="ion-activatable ripple-parent rounded-2xl shadow-sm border border-gray-100 mb-3 mt-1 [&::part(native)]:bg-white [&::part(native)]:px-4"
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

          <div className="flex items-center mb-2 mt-1">
            <AppBadge
              color={getOrderStatusColor(order.status)}
              className="m-0 font-medium"
            >
              <span className="text-xs italic">
                {getOrderStatusLabel(order.status)}
              </span>
            </AppBadge>
          </div>

          <div className="flex items-center">
            <div className="text-gray-600 mr-2 text-sm">
              Số mặt hàng: {order.items?.length}
            </div>
          </div>

          <div className="flex justify-between items-center mt-1">
            <div className="text-green-600 font-bold text-[15px]">
              {formatCurrency(order.totalAmount)}
            </div>
            <AppBadge
              color={getCustomerTypeColor(order.customer)}
              className="ml-auto"
            >
              <span className="truncate max-w-[120px]">
                {getCustomerTypeLabel(order.customer)}
              </span>
            </AppBadge>
          </div>
        </div>
        <IonRippleEffect></IonRippleEffect>
      </IonItem>

      {order.status !== OrderStatus.CANCELLED && (
        <IonItemOptions side="end">
          {!isOrderPaid && (
            <IonItemOption
              color="tertiary"
              routerLink={`/tabs/orders/update/${order.id}`}
            >
              Sửa đơn
              <IonIcon slot="icon-only" icon={createOutline}></IonIcon>
            </IonItemOption>
          )}
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
