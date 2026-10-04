import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from "@ionic/react";
import { chevronBack } from "ionicons/icons";
import { useHistory } from "react-router";
import { OrderType } from "@/common/enums/order";
import OrderPrintAction from "../../components/ExportOrderDocument/OrderPrintAction";

interface Props {
  orderId: string;
  status: string;
  orderType?: OrderType;
}

export default function OrderUpdateHeader({ orderId, status, orderType }: Props) {
  const history = useHistory();
  return (
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton className="text-gray-600" onClick={() => history.goBack()}>
            <IonIcon slot="icon-only" icon={chevronBack} />Trở lại
          </IonButton>
        </IonButtons>
        <IonTitle>Cập nhật đơn hàng</IonTitle>
        <OrderPrintAction orderId={orderId} status={status} orderType={orderType} />
      </IonToolbar>
    </IonHeader>
  );
}
