import React from "react";
import {
  IonItem,
  IonLabel,
  IonButton,
  IonRadioGroup,
  IonRadio,
  IonIcon,
} from "@ionic/react";
import { search } from "ionicons/icons";
import { PaymentMethod } from "@/common/enums/order";
import { OrderFormSectionProps } from "./orderUpdate.d";
import ErrorMessage from "@/components/ErrorMessage";

/**
 * OrderFormSection component manages customer and payment method selection:
 * - Customer selection with search functionality
 * - Payment method selection (Cash, Bank Transfer, Card)
 * - Error display for validation
 * 
 * @param formData - Form data containing customer and payment method
 * @param selectedCustomerName - Name of the selected customer
 * @param isEditMode - Whether the form is in edit mode
 * @param errors - Validation errors object
 * @param onPaymentMethodChange - Callback for payment method changes
 * @param onOpenCustomerModal - Callback to open customer selection modal
 */
const OrderFormSection: React.FC<OrderFormSectionProps> = React.memo(({
  formData,
  selectedCustomerName,
  isEditMode,
  errors,
  onPaymentMethodChange,
  onOpenCustomerModal,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Thông tin đơn hàng</h3>
      
      {/* Customer Selection */}
      <div className="mb-4">
        <IonLabel>
          <h4 className="font-medium mb-2">Khách hàng</h4>
        </IonLabel>
        <IonButton
          fill="outline"
          expand="block"
          onClick={onOpenCustomerModal}
          disabled={!isEditMode}
          className="text-left justify-start"
        >
          <IonIcon icon={search} slot="start" />
          {selectedCustomerName || "Chọn khách hàng"}
        </IonButton>
        {errors.customer && (
          <ErrorMessage message={errors.customer} />
        )}
      </div>

      {/* Payment Method Selection */}
      <div>
        <IonLabel>
          <h4 className="font-medium mb-2">Phương thức thanh toán</h4>
        </IonLabel>
        <IonRadioGroup
          value={formData.paymentMethod}
          onIonChange={onPaymentMethodChange}
        >
          <IonItem>
            <IonLabel>Tiền mặt</IonLabel>
            <IonRadio
              slot="start"
              value={PaymentMethod.CASH}
              disabled={!isEditMode}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Chuyển khoản</IonLabel>
            <IonRadio
              slot="start"
              value={PaymentMethod.BANK_TRANSFER}
              disabled={!isEditMode}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Thẻ</IonLabel>
            <IonRadio
              slot="start"
              value={PaymentMethod.CREDIT_CARD}
              disabled={!isEditMode}
            />
          </IonItem>
        </IonRadioGroup>
        {errors.paymentMethod && (
          <ErrorMessage message={errors.paymentMethod} />
        )}
      </div>
    </div>
  );
});

OrderFormSection.displayName = "OrderFormSection";

export default OrderFormSection;