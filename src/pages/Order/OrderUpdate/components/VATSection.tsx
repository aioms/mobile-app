import React from "react";
import {
  IonItem,
  IonLabel,
  IonToggle,
  IonInput,
  IonTextarea,
} from "@ionic/react";
import { VATSectionProps } from "./orderUpdate.d";
import ErrorMessage from "@/components/ErrorMessage";

/**
 * VATSection component manages VAT-related information including:
 * - VAT enable/disable toggle
 * - Company name input (when VAT is enabled)
 * - Tax code input (when VAT is enabled)
 * - Email input (when VAT is enabled)
 * - Remark textarea (when VAT is enabled)
 * 
 * @param formData - Form data containing VAT information
 * @param isEditMode - Whether the form is in edit mode
 * @param errors - Validation errors object
 * @param onVatToggle - Callback for VAT toggle changes
 * @param onInputChange - Callback for input field changes
 * @param onTextAreaChange - Callback for textarea changes
 */
const VATSection: React.FC<VATSectionProps> = React.memo(({
  formData,
  isEditMode,
  errors,
  onVatToggle,
  onInputChange,
  onTextAreaChange,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Thông tin VAT</h3>
      
      {/* VAT Toggle */}
      <IonItem>
        <IonLabel>Xuất hóa đơn VAT</IonLabel>
        <IonToggle
          checked={formData.vatEnabled}
          onIonChange={onVatToggle}
          disabled={!isEditMode}
        />
      </IonItem>

      {/* VAT Information Fields - Only show when VAT is enabled */}
      {formData.vatEnabled && (
        <div className="mt-4 space-y-4">
          {/* Company Name */}
          <IonItem>
            <IonLabel position="stacked">
              Tên công ty <span className="text-red-500">*</span>
            </IonLabel>
            <IonInput
              value={formData.companyName || ""}
              placeholder="Nhập tên công ty"
              onIonInput={onInputChange}
              name="companyName"
              disabled={!isEditMode}
            />
          </IonItem>
          {errors.companyName && (
            <ErrorMessage message={errors.companyName} />
          )}

          {/* Tax Code */}
          <IonItem>
            <IonLabel position="stacked">
              Mã số thuế <span className="text-red-500">*</span>
            </IonLabel>
            <IonInput
              value={formData.taxCode || ""}
              placeholder="Nhập mã số thuế"
              onIonInput={onInputChange}
              name="taxCode"
              disabled={!isEditMode}
            />
          </IonItem>
          {errors.taxCode && (
            <ErrorMessage message={errors.taxCode} />
          )}

          {/* Email */}
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput
              type="email"
              value={formData.email || ""}
              placeholder="Nhập email"
              onIonInput={onInputChange}
              name="email"
              disabled={!isEditMode}
            />
          </IonItem>
          {errors.email && (
            <ErrorMessage message={errors.email} />
          )}

          {/* Remark */}
          <IonItem>
            <IonLabel position="stacked">Ghi chú</IonLabel>
            <IonTextarea
              value={formData.remark || ""}
              placeholder="Nhập ghi chú"
              onIonInput={onTextAreaChange}
              name="remark"
              rows={3}
              disabled={!isEditMode}
            />
          </IonItem>
          {errors.remark && (
            <ErrorMessage message={errors.remark} />
          )}
        </div>
      )}
    </div>
  );
});

VATSection.displayName = "VATSection";

export default VATSection;