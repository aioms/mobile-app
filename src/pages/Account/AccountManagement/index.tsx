import React, { useEffect, useMemo, useState } from "react";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from "@ionic/react";
import { useHistory } from "react-router-dom";

import { AppButton, AppCard } from "@/components/UI";
import { Refresher } from "@/components/Refresher/Refresher";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import { useAuth } from "@/hooks";
import useUser from "@/hooks/apis/useUser";

import BankInfoSection from "./components/BankInfoSection";
import ChangePasswordModal from "./components/ChangePasswordModal";
import EditProfileModal from "./components/EditProfileModal";
import PersonalInfoSection from "./components/PersonalInfoSection";
import ProfileHeroCard from "./components/ProfileHeroCard";
import SecuritySection from "./components/SecuritySection";
import useAccountAvatar from "./hooks/useAccountAvatar";
import useAccountForm from "./hooks/useAccountForm";
import type { AccountProfile, PasswordFormValues, ProfileFormValues } from "./types";
import {
  canManageBankInfo,
  toAccountProfile,
  toProfileFormValues,
} from "./utils";

const AccountManagement: React.FC = () => {
  const history = useHistory();
  const { user, logout } = useAuth();
  const { getDetail } = useUser();
  const [account, setAccount] = useState<AccountProfile | null>(() =>
    toAccountProfile(user),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const { avatarUrl, isSelecting, pickAvatar } = useAccountAvatar(user?.id);
  const { isSavingProfile, isSavingPassword, submitProfile, submitPassword } =
    useAccountForm(account);
  const canManageBank = canManageBankInfo(account);
  const profileInitialValues = useMemo(
    () => toProfileFormValues(account),
    [account],
  );

  const loadAccount = async (showLoading = false) => {
    if (!user?.id) {
      setIsLoading(false);
      setLoadError("Không tìm thấy thông tin người dùng");
      return;
    }

    if (showLoading) setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getDetail(user.id);
      const nextAccount = toAccountProfile(data);

      if (!nextAccount) {
        throw new Error("Không thể tải thông tin tài khoản");
      }

      setAccount(nextAccount);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin tài khoản",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAccount(true);
    // getDetail is a plain function recreated by the hook on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadAccount(false);
    await event.detail.complete();
  };
  const handleProfileSubmit = async (values: ProfileFormValues) => {
    const isSaved = await submitProfile(values);
    if (isSaved) {
      setIsEditOpen(false);
      await loadAccount(false);
    }
  };

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    const isChanged = await submitPassword(values);
    if (!isChanged) {
      return;
    }

    setIsPasswordOpen(false);
    // Backend rotates the token version when the password changes.
    await logout();
    history.replace("/login");
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="font-semibold">Quản lý tài khoản</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <Refresher onRefresh={handleRefresh} />

        {isLoading && !account ? (
          <LoadingScreen message="Đang tải thông tin tài khoản..." />
        ) : (
          <div className="px-4 pb-20 pt-4">
            {account ? (
              <>
                {loadError && (
                  <AppCard className="!border-red-100 !bg-red-50">
                    <p className="text-sm text-red-600">{loadError}</p>
                    <AppButton
                      variant="pill"
                      size="small"
                      className="mt-2"
                      onClick={() => void loadAccount(false)}
                    >
                      Thử lại
                    </AppButton>
                  </AppCard>
                )}

                <ProfileHeroCard
                  account={account}
                  avatarUrl={avatarUrl}
                  isSelectingAvatar={isSelecting}
                  onChangeAvatar={() => void pickAvatar()}
                />
                <PersonalInfoSection
                  account={account}
                  onEdit={() => setIsEditOpen(true)}
                />
                {canManageBank && (
                  <BankInfoSection
                    account={account}
                    onEdit={() => setIsEditOpen(true)}
                  />
                )}
                <SecuritySection
                  onChangePassword={() => setIsPasswordOpen(true)}
                />
              </>
            ) : (
              <AppCard className="mt-10 text-center">
                <p className="font-semibold text-gray-900">
                  Không thể tải tài khoản
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {loadError || "Vui lòng thử lại sau."}
                </p>
                <AppButton
                  variant="primary"
                  className="mt-4"
                  onClick={() => void loadAccount(true)}
                >
                  Thử lại
                </AppButton>
              </AppCard>
            )}
          </div>
        )}

        <EditProfileModal
          isOpen={isEditOpen}
          canManageBank={canManageBank}
          initialValues={profileInitialValues}
          isSubmitting={isSavingProfile}
          onDismiss={() => setIsEditOpen(false)}
          onSubmit={handleProfileSubmit}
        />
        <ChangePasswordModal
          isOpen={isPasswordOpen}
          isSubmitting={isSavingPassword}
          onDismiss={() => setIsPasswordOpen(false)}
          onSubmit={handlePasswordSubmit}
        />
      </IonContent>
    </IonPage>
  );
};

export default AccountManagement;
