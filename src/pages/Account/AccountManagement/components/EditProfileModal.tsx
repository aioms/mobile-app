import React, { useEffect } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { Controller, useForm } from "react-hook-form";

import { AppButton } from "@/components/UI";
import type { ProfileFormValues } from "../types";

interface EditProfileModalProps {
  isOpen: boolean;
  canManageBank: boolean;
  initialValues: ProfileFormValues;
  isSubmitting: boolean;
  onDismiss: () => void;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
}

const PHONE_PATTERN = /^(0|\+84)\d{9}$/;
const BANK_CODE_PATTERN = /^[A-Za-z0-9]{2,10}$/;
const BANK_ACCOUNT_PATTERN = /^\d{6,20}$/;

const requiredText = (label: string) => `${label} không được để trống`;

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  canManageBank,
  initialValues,
  isSubmitting,
  onDismiss,
  onSubmit,
}) => {
  const isBankLocked = canManageBank && !initialValues.storeCode;
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<ProfileFormValues>({ defaultValues: initialValues });

  useEffect(() => {
    if (isOpen) {
      reset(initialValues);
    }
  }, [initialValues, isOpen, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonTitle className="font-semibold">Chỉnh sửa thông tin</IonTitle>
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
          {canManageBank && (
            <p className="mb-4 text-xs text-gray-500">
              Thông tin ngân hàng được dùng để tạo mã QR thanh toán.
            </p>
          )}

          <div className="space-y-4">
            <Controller
              control={control}
              name="fullname"
              rules={{
                validate: (value) => {
                  const trimmed = value.trim();
                  if (!trimmed) return requiredText("Họ và tên");
                  if (trimmed.length < 2) return "Họ và tên phải có ít nhất 2 ký tự";
                  if (trimmed.length > 100) return "Họ và tên tối đa 100 ký tự";
                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <IonInput
                  fill="outline"
                  label="Họ và tên"
                  labelPlacement="stacked"
                  autocomplete="name"
                  value={field.value}
                  onIonInput={(event) => field.onChange(event.detail.value ?? "")}
                  onIonBlur={field.onBlur}
                  errorText={fieldState.error?.message}
                  className={fieldState.error ? "ion-invalid ion-touched" : ""}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              rules={{
                validate: (value) => {
                  const trimmed = value.trim();
                  if (!trimmed) return requiredText("Số điện thoại");
                  return (
                    PHONE_PATTERN.test(trimmed) ||
                    "Số điện thoại không hợp lệ (VD: 0901234567)"
                  );
                },
              }}
              render={({ field, fieldState }) => (
                <IonInput
                  type="tel"
                  inputMode="tel"
                  fill="outline"
                  label="Số điện thoại"
                  labelPlacement="stacked"
                  autocomplete="tel"
                  value={field.value}
                  onIonInput={(event) => field.onChange(event.detail.value ?? "")}
                  onIonBlur={field.onBlur}
                  errorText={fieldState.error?.message}
                  className={fieldState.error ? "ion-invalid ion-touched" : ""}
                />
              )}
            />

            <IonInput
              fill="outline"
              label="Tên đăng nhập"
              labelPlacement="stacked"
              value={initialValues.username}
              readonly
              helperText="Không thể thay đổi trong màn hình này"
            />

            <IonInput
              fill="outline"
              label="Chi nhánh"
              labelPlacement="stacked"
              value={initialValues.storeCode || "Chưa được gán"}
              readonly
              helperText="Chi nhánh được quản lý bởi quản trị viên"
            />

            {canManageBank && (
              <>
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Thông tin ngân hàng
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {isBankLocked
                      ? "Tài khoản chưa được gán chi nhánh nên không thể chỉnh sửa thông tin ngân hàng."
                      : "Có thể bỏ trống nếu chưa có tài khoản ngân hàng."}
                  </p>
                </div>

                <Controller
                  control={control}
                  name="bankCode"
                  rules={{
                    validate: (value) =>
                      !value.trim() ||
                      BANK_CODE_PATTERN.test(value.trim()) ||
                      "Mã ngân hàng không hợp lệ (VD: VCB, MB, 970436)",
                  }}
                  render={({ field, fieldState }) => (
                    <IonInput
                      fill="outline"
                      label="Mã ngân hàng"
                      labelPlacement="stacked"
                      autocomplete="off"
                      disabled={isBankLocked}
                      value={field.value}
                      onIonInput={(event) =>
                        field.onChange((event.detail.value ?? "").toUpperCase())
                      }
                      onIonBlur={field.onBlur}
                      errorText={fieldState.error?.message}
                      className={fieldState.error ? "ion-invalid ion-touched" : ""}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="bankAccountNumber"
                  rules={{
                    validate: (value) =>
                      !value.trim() ||
                      BANK_ACCOUNT_PATTERN.test(value.trim()) ||
                      "Số tài khoản phải gồm 6-20 chữ số",
                  }}
                  render={({ field, fieldState }) => (
                    <IonInput
                      type="tel"
                      inputMode="numeric"
                      fill="outline"
                      label="Số tài khoản"
                      labelPlacement="stacked"
                      autocomplete="off"
                      disabled={isBankLocked}
                      value={field.value}
                      onIonInput={(event) =>
                        field.onChange(event.detail.value ?? "")
                      }
                      onIonBlur={field.onBlur}
                      errorText={fieldState.error?.message}
                      className={fieldState.error ? "ion-invalid ion-touched" : ""}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="bankAccountName"
                  rules={{
                    validate: (value) => {
                      const trimmed = value.trim();
                      if (!trimmed) return true;
                      if (trimmed.length < 2)
                        return "Tên chủ tài khoản phải có ít nhất 2 ký tự";
                      if (trimmed.length > 100)
                        return "Tên chủ tài khoản tối đa 100 ký tự";
                      return true;
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <IonInput
                      fill="outline"
                      label="Tên chủ tài khoản"
                      labelPlacement="stacked"
                      autocomplete="off"
                      disabled={isBankLocked}
                      value={field.value}
                      onIonInput={(event) =>
                        field.onChange((event.detail.value ?? "").toUpperCase())
                      }
                      onIonBlur={field.onBlur}
                      errorText={fieldState.error?.message}
                      className={fieldState.error ? "ion-invalid ion-touched" : ""}
                    />
                  )}
                />
              </>
            )}
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
              loadingText="Đang lưu..."
              disabled={!isDirty}
            >
              Lưu thay đổi
            </AppButton>
          </div>
        </form>
      </IonContent>
    </IonModal>
  );
};

export default EditProfileModal;
