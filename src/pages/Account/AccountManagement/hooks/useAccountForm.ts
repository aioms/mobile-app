import { useState } from "react";
import { Toast } from "@capacitor/toast";

import { useLoading } from "@/hooks";
import useUser, { type UpdateUserPayload } from "@/hooks/apis/useUser";
import type { AccountProfile, PasswordFormValues, ProfileFormValues } from "../types";
import { canEditBankInfo } from "../utils";

const useAccountForm = (account: AccountProfile | null) => {
  const { update } = useUser();
  const { withLoading } = useLoading();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const accountId = account?.id;

  const showMissingAccountError = () =>
    Toast.show({
      text: "Không tìm thấy thông tin tài khoản",
      duration: "short",
      position: "top",
    });

  const submitProfile = async (
    values: ProfileFormValues,
  ): Promise<boolean> => {
    if (!accountId) {
      await showMissingAccountError();
      return false;
    }

    setIsSavingProfile(true);
    let isSaved = false;

    await withLoading(async () => {
      const payload: UpdateUserPayload = {
        fullname: values.fullname.trim(),
        phone: values.phone.trim(),
      };

      // Chỉ admin/developer đã được gán chi nhánh mới được cập nhật ngân hàng.
      if (canEditBankInfo(account)) {
        payload.bankCode = values.bankCode.trim().toUpperCase();
        payload.bankAccountNumber = values.bankAccountNumber.trim();
        payload.bankAccountName = values.bankAccountName.trim().toUpperCase();
      }

      const response = await update(accountId, payload);

      if (!response?.success) {
        throw new Error(
          response?.message || "Không thể cập nhật thông tin tài khoản",
        );
      }

      isSaved = true;
    });

    setIsSavingProfile(false);

    if (isSaved) {
      await Toast.show({
        text: "Cập nhật thông tin thành công",
        duration: "short",
        position: "top",
      });
    }

    return isSaved;
  };

  const submitPassword = async (
    values: PasswordFormValues,
  ): Promise<boolean> => {
    if (!accountId) {
      await showMissingAccountError();
      return false;
    }

    setIsSavingPassword(true);
    let isChanged = false;

    await withLoading(async () => {
      // API hiện chỉ nhận mật khẩu mới; mật khẩu cũ dùng để xác nhận thao tác.
      const response = await update(accountId, {
        password: values.newPassword,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Không thể đổi mật khẩu");
      }

      isChanged = true;
    });

    setIsSavingPassword(false);

    if (isChanged) {
      await Toast.show({
        text: "Đổi mật khẩu thành công",
        duration: "short",
        position: "top",
      });
    }

    return isChanged;
  };

  return {
    isSavingProfile,
    isSavingPassword,
    submitProfile,
    submitPassword,
  };
};

export default useAccountForm;
