import React, { useState } from "react";
import { useParams, useHistory } from "react-router";
import { Toast } from "@capacitor/toast";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  useIonActionSheet,
  RefresherEventDetail,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  ellipsisVertical,
  chevronBack,
  checkmarkCircle,
  cubeOutline,
} from "ionicons/icons";

import useOrder from "@/hooks/apis/useOrder";
import { useLoading } from "@/hooks";
import type { IOrder } from "@/types/order.type";
import {
  getOrderStatusColor,
  getOrderStatusLabel,
  getPaymentMethodLabel,
} from "@/common/constants/order";
import { OrderStatus } from "@/common/enums/order";

import { Refresher } from "@/components/Refresher/Refresher";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import OrderItemDetail from "./components/OrderItemDetail";
import OrderInfoSection from "./components/OrderInfoSection";
import PaymentInfoSection from "./components/PaymentInfoSection";
import VatInfoSection from "./components/VatInfoSection";

import "./OrderDetail.css";

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [presentActionSheet] = useIonActionSheet();

  const { isLoading, withLoading } = useLoading();
  const { getDetail } = useOrder();

  const fetchOrderDetail = async () => {
    await withLoading(async () => {
      try {
        const result = await getDetail(id);

        if (!result) {
          return await Toast.show({
            text: "Không tìm thấy đơn hàng",
            duration: "short",
            position: "top",
          });
        }

        setOrder(result);
      } catch (error) {
        await Toast.show({
          text: (error as Error).message,
          duration: "short",
          position: "top",
        });
      }
    });
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchOrderDetail();
    event.detail.complete();
  };

  const handleActionSheet = () => {
    presentActionSheet({
      header: "Tùy chọn",
      buttons: [
        {
          text: "Chỉnh sửa",
          handler: () => {
            history.push(`/tabs/orders/update/${id}`);
          },
        },
        {
          text: "Xóa",
          role: "destructive",
          handler: () => {
            Toast.show({
              text: "Tính năng này đang được phát triển",
              duration: "short",
              position: "center",
            });
          },
        },
        {
          text: "Hủy",
          role: "cancel",
        },
      ],
    });
  };

  useIonViewWillEnter(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={chevronBack} />
              Trở lại
            </IonButton>
          </IonButtons>
          <IonTitle>Mã đơn hàng</IonTitle>
          {order?.status !== OrderStatus.CANCELLED && (
            <IonButtons slot="end">
              <IonButton onClick={handleActionSheet}>
                <IonIcon icon={ellipsisVertical} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding bg-background">
        {isLoading && <LoadingScreen message="Đang tải dữ liệu..." />}
        <Refresher onRefresh={handleRefresh} />

        {order && (
          <>
            {/* Order Status Header */}
            <div className="bg-card rounded-lg shadow-sm mb-4">
              <div
                className={`p-4 bg-${getOrderStatusColor(
                  order.status
                )} rounded-lg`}
              >
                <div className="flex items-center">
                  <IonIcon
                    icon={checkmarkCircle}
                    className="text-white text-xl mr-2"
                  />
                  <span className="text-white font-medium">
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
                <div className="text-white mt-1">
                  Mã đơn hàng: #{order.code}
                </div>
              </div>
            </div>

            {/* Order Info Section */}
            <OrderInfoSection
              orderDate={order.createdAt}
              customer={order.customer}
              note={order.note}
            />

            {/* Product List Section */}
            <div className="bg-card rounded-lg shadow-sm mb-4">
              <div className="p-4 border-b border-border">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center mr-2">
                    <IonIcon
                      icon={cubeOutline}
                      className="text-white text-sm"
                    />
                  </div>
                  <span className="font-medium">Danh sách sản phẩm</span>
                </div>
              </div>

              <div>
                {order.items.map((item, index) => (
                  <OrderItemDetail
                    key={index}
                    name={item.productName}
                    code={item.code}
                    price={item.price}
                    quantity={item.quantity}
                  />
                ))}
              </div>

              <div className="p-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Tổng số sản phẩm:
                  </span>
                  <span className="font-medium">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info Section */}
            <PaymentInfoSection
              subtotal={order.totalAmount + order.discountAmount}
              discount={order.discountAmount}
              total={order.totalAmount}
              items={order.items}
              paymentMethod={getPaymentMethodLabel(order.paymentMethod)}
            />

            {/* VAT Info Section */}
            {order.vatInfo && <VatInfoSection vatInfo={order.vatInfo} />}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default OrderDetail;
