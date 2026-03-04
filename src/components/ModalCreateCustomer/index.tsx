import React from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useForm, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

interface ICustomerFormData {
  name: string;
  phone: string;
  note: string;
}

interface ModalCreateCustomerProps {
  dismiss: (data?: any, role?: string) => void;
}

const ModalCreateCustomer: React.FC<ModalCreateCustomerProps> = ({
  dismiss,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ICustomerFormData>({
    defaultValues: {
      name: "",
      phone: "",
      note: "",
    },
  });

  const onSubmit = (data: ICustomerFormData) => {
    dismiss(
      {
        name: data.name.trim(),
        phone: data.phone.trim(),
        note: data.note.trim(),
      },
      "confirm"
    );
  };

  const handleCancel = () => {
    dismiss(null, "cancel");
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleCancel} disabled={isSubmitting}>
              Hủy
            </IonButton>
          </IonButtons>
          <IonTitle>Thêm khách hàng mới</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={handleSubmit(onSubmit)}
              strong={true}
              disabled={isSubmitting}
            >
              {isSubmitting ? <IonSpinner name="crescent" /> : "Xác nhận"}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="space-y-4">
          {/* Customer Name */}
          <Controller
            name="name"
            control={control}
            rules={{ required: "Vui lòng nhập tên khách hàng" }}
            render={({ field }) => (
              <div>
                <IonInput
                  className={cn("custom-padding border rounded-lg", {
                    "ion-valid": !errors.name && field.value.length > 0,
                    "ion-invalid ion-touched": !!errors.name,
                  })}
                  label="Tên khách hàng"
                  labelPlacement="floating"
                  fill="solid"
                  placeholder="Nhập tên khách hàng"
                  value={field.value}
                  onIonInput={(e) => field.onChange(e.detail.value ?? "")}
                  disabled={isSubmitting}
                  errorText={errors.name?.message}
                >
                  <div slot="label">
                    Tên khách hàng <span className="text-red-500">*</span>
                  </div>
                </IonInput>
              </div>
            )}
          />

          {/* Phone Number */}
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <IonInput
                className="custom-padding border rounded-lg"
                label="Số điện thoại"
                labelPlacement="floating"
                fill="solid"
                type="tel"
                placeholder="Nhập số điện thoại"
                value={field.value}
                onIonInput={(e) => field.onChange(e.detail.value ?? "")}
                disabled={isSubmitting}
              />
            )}
          />

          {/* Note */}
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <IonTextarea
                className="border border-input rounded-lg px-2"
                label="Ghi chú"
                labelPlacement="floating"
                fill="outline"
                placeholder="Nhập ghi chú (tùy chọn)"
                rows={3}
                value={field.value}
                onIonInput={(e) => field.onChange(e.detail.value ?? "")}
                disabled={isSubmitting}
              />
            )}
          />
        </div>
      </IonContent>
    </>
  );
};

export default ModalCreateCustomer;
