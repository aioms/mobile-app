import React from "react";
import {
  IonItem,
  IonLabel,
  IonText,
} from "@ionic/react";
import { formatCurrency } from "@/helpers/formatters";
import { OrderSummarySectionProps } from "./orderUpdate.d";

/**
 * OrderSummarySection component displays order financial summary:
 * - Subtotal (before discount and VAT)
 * - Discount amount
 * - VAT amount
 * - Final total
 * 
 * @param subtotal - Order subtotal before discount and VAT
 * @param discount - Total discount amount
 * @param vatTotal - Total VAT amount
 * @param finalTotal - Final total after discount and VAT
 */
const OrderSummarySection: React.FC<OrderSummarySectionProps> = React.memo(({
  subtotal,
  discount,
  vatTotal,
  finalTotal,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Tổng kết đơn hàng</h3>
      
      {/* Subtotal */}
      <IonItem>
        <IonLabel>
          <h4>Tạm tính</h4>
        </IonLabel>
        <IonText slot="end">
          <p className="font-medium">{formatCurrency(subtotal)}</p>
        </IonText>
      </IonItem>

      {/* Discount */}
      {discount > 0 && (
        <IonItem>
          <IonLabel>
            <h4>Giảm giá</h4>
          </IonLabel>
          <IonText slot="end" color="success">
            <p className="font-medium">-{formatCurrency(discount)}</p>
          </IonText>
        </IonItem>
      )}

      {/* VAT */}
      {vatTotal > 0 && (
        <IonItem>
          <IonLabel>
            <h4>VAT</h4>
          </IonLabel>
          <IonText slot="end">
            <p className="font-medium">{formatCurrency(vatTotal)}</p>
          </IonText>
        </IonItem>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 my-2"></div>

      {/* Final Total */}
      <IonItem>
        <IonLabel>
          <h3 className="font-bold text-lg">Tổng cộng</h3>
        </IonLabel>
        <IonText slot="end" color="primary">
          <h3 className="font-bold text-lg">{formatCurrency(finalTotal)}</h3>
        </IonText>
      </IonItem>
    </div>
  );
});

OrderSummarySection.displayName = "OrderSummarySection";

export default OrderSummarySection;