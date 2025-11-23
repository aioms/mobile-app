import React from "react";
import { IonIcon } from "@ionic/react";
import { checkmarkCircle } from "ionicons/icons";
import { getOrderStatusColor, getOrderStatusLabel } from "@/common/constants/order";
import { OrderStatusHeaderProps } from "./orderUpdate.d";

/**
 * OrderStatusHeader component displays the current order status and order code
 * in a styled header section with appropriate color coding.
 * 
 * @param status - The current order status
 * @param orderCode - The order code/ID to display
 */
const OrderStatusHeader: React.FC<OrderStatusHeaderProps> = React.memo(({
  status,
  orderCode,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm mb-4">
      <div
        className={`p-4 bg-${getOrderStatusColor(status)} rounded-lg`}
      >
        <div className="flex items-center">
          <IonIcon
            icon={checkmarkCircle}
            className="text-white text-xl mr-2"
          />
          <span className="text-white font-medium">
            {getOrderStatusLabel(status)}
          </span>
        </div>
        <div className="text-white mt-1">
          Mã đơn hàng: #{orderCode}
        </div>
      </div>
    </div>
  );
});

OrderStatusHeader.displayName = "OrderStatusHeader";

export default OrderStatusHeader;