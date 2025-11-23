import React from "react";
import {
  IonButton,
  IonIcon,
  IonFooter,
} from "@ionic/react";
import {
  checkmarkCircleOutline,
  removeCircleOutline,
} from "ionicons/icons";
import { OrderStatus } from "@/common/enums/order";
import { OrderActionsSectionProps } from "./orderUpdate.d";

/**
 * OrderActionsSection component displays action buttons for order management:
 * - Cancel order button (if order is not already cancelled)
 * - Confirm order button (in footer)
 * 
 * @param orderStatus - Current order status
 * @param isLoading - Loading state for buttons
 * @param onCancel - Handler for cancel order action
 * @param onSubmit - Handler for submit/confirm order action
 */
const OrderActionsSection: React.FC<OrderActionsSectionProps> = React.memo(({
  orderStatus,
  isLoading,
  onCancel,
  onSubmit,
}) => {
  return (
    <>
      {/* Cancel Order Button - Only show if order is not cancelled */}
      {orderStatus !== OrderStatus.CANCELLED && (
        <div className="mb-4">
          <IonButton
            expand="block"
            fill="outline"
            className="rounded-lg text-red-600"
            onClick={onCancel}
            disabled={isLoading}
          >
            {isLoading ? (
              "Đang xử lý..."
            ) : (
              <>
                <IonIcon icon={removeCircleOutline} slot="start" />
                Hủy đơn
              </>
            )}
          </IonButton>
        </div>
      )}

      {/* Confirm Order Button - In Footer */}
      <IonFooter className="ion-no-border">
        <div className="p-2 bg-card">
          <IonButton
            expand="block"
            className="rounded-lg"
            onClick={onSubmit}
            disabled={isLoading}
            color="primary"
          >
            {isLoading ? (
              "Đang xử lý..."
            ) : (
              <>
                <IonIcon 
                  icon={checkmarkCircleOutline} 
                  slot="start" 
                />
                Xác nhận đơn hàng
              </>
            )}
          </IonButton>
        </div>
      </IonFooter>
    </>
  );
});

OrderActionsSection.displayName = "OrderActionsSection";

export default OrderActionsSection;