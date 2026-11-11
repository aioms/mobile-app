import React, { useEffect } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { Controller, useForm } from "react-hook-form";

import { AppButton } from "@/components/UI";
import type { PasswordFormValues } from "../types";

interface ChangePasswordModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onDismiss: () => void;
  onSubmit: (values: PasswordFormValues) => Promise<void>;
}

const EMPTY_VALUES: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  isSubmitting,
  onDismiss,
  onSubmit,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { isDirty },
  } = useForm<PasswordFormValues>({ defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (isOpen) {
      reset(EMPTY_VALUES);
    }
  }, [isOpen, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonTitle className="font-semibold">Đổi mật khẩu</IonTitle>
          <IonButtons slot="end">
            <IonButton
              aria-label="Đóng"
              disabled={isSubmitting}
              onClick={onDismiss}
            >
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <form className="px-4 pb-8 pt-4" onSubmit={submit} noValidate>
          <p className="mb-4 text-xs text-gray-500">
            Mật khẩu mới phải có ít nhất 6 ký tự và khác mật khẩu hiện tại.
          </p>

          <div className="space-y-4">
            <Controller
              control={control}
              name="currentPassword"
              rules={{
                required: "Vui lòng nhập mật khẩu hiện tại",
                minLength: {
                  value: 6,
                  message: "Mật khẩu phải có ít nhất 6 ký tự",
                },
              }}
              render={({ field, fieldState }) => (
                <IonInput
                  type="password"
                  fill="outline"
                  label="Mật khẩu hiện tại"
                  labelPlacement="stacked"
                  autocomplete="current-password"
                  value={field.value}
                  onIonInput={(event) => field.onChange(event.detail.value ?? "")}
                  onIonBlur={field.onBlur}
                  errorText={fieldState.error?.message}
                  className={fieldState.error ? "ion-invalid ion-touched" : ""}
                >
                  <IonInputPasswordToggle slot="end" color="medium" />
                </IonInput>
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              rules={{
                required: "Vui lòng nhập mật khẩu mới",
                minLength: {
                  value: 6,
                  message: "Mật khẩu mới phải có ít nhất 6 ký tự",
                },
                maxLength: {
                  value: 50,
                  message: "Mật khẩu mới tối đa 50 ký tự",
                },
                validate: (value) =>
                  value !== getValues("currentPassword") ||
                  "Mật khẩu mới phải khác mật khẩu hiện tại",
              }}
              render={({ field, fieldState }) => (
                <IonInput
                  type="password"
                  fill="outline"
                  label="Mật khẩu mới"
                  labelPlacement="stacked"
                  autocomplete="new-password"
                  value={field.value}
                  onIonInput={(event) => field.onChange(event.detail.value ?? "")}
                  onIonBlur={field.onBlur}
                  errorText={fieldState.error?.message}
                  className={fieldState.error ? "ion-invalid ion-touched" : ""}
                >
                  <IonInputPasswordToggle slot="end" color="medium" />
                </IonInput>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: "Vui lòng xác nhận mật khẩu mới",
                validate: (value) =>
                  value === getValues("newPassword") ||
                  "Mật khẩu xác nhận không khớp",
              }}
              render={({ field, fieldState }) => (
                <IonInput
                  type="password"
                  fill="outline"
                  label="Xác nhận mật khẩu mới"
                  labelPlacement="stacked"
                  autocomplete="new-password"
                  value={field.value}
                  onIonInput={(event) => field.onChange(event.detail.value ?? "")}
                  onIonBlur={field.onBlur}
                  errorText={fieldState.error?.message}
                  className={fieldState.error ? "ion-invalid ion-touched" : ""}
                >
                  <IonInputPasswordToggle slot="end" color="medium" />
                </IonInput>
              )}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <AppButton
              type="button"
              variant="secondary"
              fullWidth
              disabled={isSubmitting}
              onClick={onDismiss}
            >
              Huỷ
            </AppButton>
            <AppButton
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
              loadingText="Đang cập nhật..."
              disabled={!isDirty}
            >
              Đổi mật khẩu
            </AppButton>
          </div>
        </form>
      </IonContent>
    </IonModal>
  );
};

export default ChangePasswordModal;
