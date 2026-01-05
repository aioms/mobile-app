import React, { useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLabel,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from "@ionic/react";

interface CreateSupplierModalProps {
  onDismiss: (data?: { name: string; phone: string; note: string }, role?: string) => void;
}

const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({ onDismiss }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    note: "",
  });

  const [errors, setErrors] = useState({
    name: "",
  });

  const handleSubmit = () => {
    // Validate form
    const newErrors = {
      name: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Tên nhà cung cấp là bắt buộc";
    }

    setErrors(newErrors);

    // If there are errors, don't submit
    if (newErrors.name) {
      return;
    }

    // Submit the form
    onDismiss(formData, "confirm");
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tạo nhà cung cấp mới</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => onDismiss(undefined, "cancel")}>
              Hủy
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="space-y-4">
          {/* Name Input */}
          <div className="flex flex-col">
            <IonLabel position="stacked" className="mb-2">
              Tên nhà cung cấp <span className="text-red-500">*</span>
            </IonLabel>
            <IonInput
              placeholder="Nhập tên nhà cung cấp"
              value={formData.name}
              onIonInput={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  name: e.detail.value || "",
                }));
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              className="border rounded-lg px-3 py-2"
            />
            {errors.name && (
              <span className="text-red-500 text-sm mt-1">{errors.name}</span>
            )}
          </div>

          {/* Phone Input */}
          <div className="flex flex-col">
            <IonLabel position="stacked" className="mb-2">
              Số điện thoại
            </IonLabel>
            <IonInput
              type="tel"
              placeholder="Nhập số điện thoại"
              value={formData.phone}
              onIonInput={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  phone: e.detail.value || "",
                }));
                setErrors((prev) => ({ ...prev, phone: "" }));
              }}
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Note Input */}
          <div className="flex flex-col">
            <IonLabel position="stacked" className="mb-2">
              Ghi chú
            </IonLabel>
            <IonTextarea
              placeholder="Nhập ghi chú (tùy chọn)"
              value={formData.note}
              rows={3}
              onIonInput={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  note: e.detail.value || "",
                }))
              }
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Submit Button */}
          <IonButton
            expand="block"
            onClick={handleSubmit}
            className="mt-6"
          >
            Tạo nhà cung cấp
          </IonButton>
        </div>
      </IonContent>
    </>
  );
};

export default CreateSupplierModal;
