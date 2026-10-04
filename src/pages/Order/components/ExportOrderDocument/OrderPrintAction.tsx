import { useState } from "react";
import { IonButton, IonButtons, IonIcon } from "@ionic/react";
import { AppButton } from "@/components/UI";
import { printOutline } from "ionicons/icons";
import { OrderStatus, OrderType } from "@/common/enums/order";
import ExportOrderDocumentModal from "./ExportOrderDocumentModal";

interface Props {
  orderId: string;
  status?: string;
  orderType?: OrderType;
  placement?: "toolbar" | "content";
}

export default function OrderPrintAction({ orderId, status, orderType: _orderType, placement = "toolbar" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  if (!status || status === OrderStatus.CANCELLED) return null;
  return (
    <>
      {placement === "content" ? (
        <AppButton data-cy="order-print" variant="primary" size="large" fullWidth className="mb-4 min-h-[44px]" icon={<IonIcon icon={printOutline} />} onClick={() => setIsOpen(true)}>
          In đơn
        </AppButton>
      ) : <IonButtons slot="end">
        <IonButton style={{ minHeight: 44 }} data-cy="order-print" onClick={() => setIsOpen(true)}>
          <IonIcon icon={printOutline} />In đơn
        </IonButton>
      </IonButtons>}
      <ExportOrderDocumentModal isOpen={isOpen} orderId={orderId} onClose={() => setIsOpen(false)} />
    </>
  );
}
