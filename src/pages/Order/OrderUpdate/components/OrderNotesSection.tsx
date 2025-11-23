import React from "react";
import {
  IonItem,
  IonLabel,
  IonTextarea,
} from "@ionic/react";
import { OrderNotesSectionProps } from "./orderUpdate.d";

/**
 * OrderNotesSection component manages order notes:
 * - Order notes textarea input
 * - Handles text area changes
 * 
 * @param note - Current note value
 * @param isEditMode - Whether the form is in edit mode
 * @param onTextAreaChange - Callback for textarea changes
 */
const OrderNotesSection: React.FC<OrderNotesSectionProps> = React.memo(({
  note,
  isEditMode,
  onTextAreaChange,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">Ghi chú đơn hàng</h3>
      
      <IonItem>
        <IonLabel position="stacked">Ghi chú</IonLabel>
        <IonTextarea
          value={note}
          placeholder="Nhập ghi chú cho đơn hàng"
          onIonInput={onTextAreaChange}
          name="note"
          rows={4}
          disabled={!isEditMode}
        />
      </IonItem>
    </div>
  );
});

OrderNotesSection.displayName = "OrderNotesSection";

export default OrderNotesSection;