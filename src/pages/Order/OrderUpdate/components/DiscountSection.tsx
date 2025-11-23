import React from "react";
import {
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonInput,
} from "@ionic/react";
import { DiscountSectionProps } from "./orderUpdate.d";

/**
 * DiscountSection component manages discount settings including:
 * - Discount type selection (percentage or fixed amount)
 * - Discount percentage input
 * - Discount fixed amount input
 * 
 * @param formData - Form data containing discount information
 * @param isEditMode - Whether the form is in edit mode
 * @param onDiscountChange - Callback for discount value changes
 * @param onDiscountTypeChange - Callback for discount type changes
 */
const DiscountSection: React.FC<DiscountSectionProps> = React.memo(({
  formData,
  isEditMode,
  onDiscountChange,
  onDiscountTypeChange,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Giảm giá</h3>
      
      {/* Discount Type Selection */}
      <IonRadioGroup
        value={formData.discountType}
        onIonChange={onDiscountTypeChange}
      >
        <IonItem>
          <IonLabel>Giảm theo phần trăm (%)</IonLabel>
          <IonRadio
            slot="start"
            value="percentage"
            disabled={!isEditMode}
          />
        </IonItem>
        <IonItem>
          <IonLabel>Giảm theo số tiền cố định</IonLabel>
          <IonRadio
            slot="start"
            value="fixed"
            disabled={!isEditMode}
          />
        </IonItem>
      </IonRadioGroup>

      {/* Discount Input Fields */}
      {formData.discountType === "percentage" ? (
        <IonItem className="mt-3">
          <IonLabel position="stacked">Phần trăm giảm giá (%)</IonLabel>
          <IonInput
            type="number"
            value={formData.discountPercentage || 0}
            min="0"
            max="100"
            step="0.01"
            placeholder="Nhập phần trăm giảm giá"
            onIonInput={onDiscountChange}
            name="discountPercentage"
            disabled={!isEditMode}
          />
        </IonItem>
      ) : (
        <IonItem className="mt-3">
          <IonLabel position="stacked">Số tiền giảm giá (VND)</IonLabel>
          <IonInput
            type="text"
            value={formData.discountAmountFormatted || ""}
            placeholder="Nhập số tiền giảm giá"
            onIonInput={onDiscountChange}
            name="discountAmountFormatted"
            disabled={!isEditMode}
          />
        </IonItem>
      )}
    </div>
  );
});

DiscountSection.displayName = "DiscountSection";

export default DiscountSection;