import React, { useState } from "react";
import { IonAlert, IonIcon } from "@ionic/react";
import { logOutOutline, lockClosedOutline } from "ionicons/icons";
import { Toast } from "@capacitor/toast";
import { useHistory } from "react-router-dom";

import { AppButton, AppCard, AppListItem } from "@/components/UI";
import { useAuth } from "@/hooks";

interface SecuritySectionProps {
  onChangePassword: () => void;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({
  onChangePassword,
}) => {
  const history = useHistory();
  const { logout } = useAuth();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    await Toast.show({
      text: "Đã đăng xuất",
      duration: "short",
      position: "bottom",
    });
    history.replace("/login");
  };

  return (
    <AppCard noPadding>
      <div className="px-4 pb-1 pt-4">
        <h3 className="font-semibold text-gray-900">Bảo mật</h3>
      </div>

      <AppListItem onClick={onChangePassword}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <IonIcon icon={lockClosedOutline} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Đổi mật khẩu</p>
            <p className="text-xs text-gray-500">
              Cập nhật mật khẩu đăng nhập của bạn
            </p>
          </div>
        </div>
      </AppListItem>

      <div className="p-4">
        <AppButton
          variant="secondary"
          fullWidth
          loading={isLoggingOut}
          loadingText="Đang đăng xuất..."
          icon={<IonIcon icon={logOutOutline} className="text-lg" />}
          className="!bg-red-50 !text-red-600 border border-red-100"
          onClick={() => setIsLogoutAlertOpen(true)}
        >
          Đăng xuất
        </AppButton>
      </div>

      <IonAlert
        isOpen={isLogoutAlertOpen}
        onDidDismiss={() => setIsLogoutAlertOpen(false)}
        header="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?"
        buttons={[
          {
            text: "Huỷ",
            role: "cancel",
          },
          {
            text: "Đăng xuất",
            role: "destructive",
            handler: () => {
              void handleLogout();
            },
          },
        ]}
      />
    </AppCard>
  );
};

export default SecuritySection;
