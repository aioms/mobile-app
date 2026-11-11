import React from "react";
import { IonIcon, IonSpinner } from "@ionic/react";
import { notificationsOutline, sendOutline } from "ionicons/icons";
import AppBadge from "@/components/UI/AppBadge";
import AppButton from "@/components/UI/AppButton";
import AppCard from "@/components/UI/AppCard";
import SettingToggleRow from "./SettingToggleRow";
import SectionHeader from "./SectionHeader";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useCustomToast } from "@/hooks/useCustomToast";
import type { PushPermissionStatus } from "@/types/push.type";

const STATUS_COPY: Record<
  PushPermissionStatus,
  { badge: string; color: "success" | "warning" | "danger" | "medium" }
> = {
  subscribed: { badge: "Đã bật", color: "success" },
  idle: { badge: "Chưa bật", color: "medium" },
  denied: { badge: "Bị chặn", color: "danger" },
  unsupported: { badge: "Không hỗ trợ", color: "warning" },
};

const STATUS_DESCRIPTION: Record<PushPermissionStatus, string> = {
  subscribed: "Thiết bị này sẽ nhận thông báo đẩy khi có đơn hàng mới hoặc kho cạn.",
  idle: "Bật để nhận thông báo ngay cả khi ứng dụng đang đóng.",
  denied:
    "Trình duyệt đang chặn thông báo. Mở cài đặt trang web và cho phép thông báo.",
  unsupported:
    "Trình duyệt hiện tại không hỗ trợ thông báo đẩy. Hãy dùng Chrome, Edge hoặc thêm ứng dụng vào màn hình chính trên iOS.",
};

const NotificationSection: React.FC = () => {
  const {
    status,
    isLoading,
    isToggling,
    isTesting,
    error,
    enable,
    disable,
    sendTest,
  } = usePushNotifications();
  const { showSuccess, showError } = useCustomToast();

  const copy = STATUS_COPY[status];
  const canToggle = status === "subscribed" || status === "idle";

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await enable();
      return;
    }
    await disable();
  };

  const handleSendTest = async () => {
    const sent = await sendTest();
    if (sent) await showSuccess("Đã gửi thông báo thử tới thiết bị");
    else await showError("Không gửi được thông báo thử");
  };

  return (
    <>
      <SectionHeader
        icon={notificationsOutline}
        title="Thông báo"
        description="Nhận cảnh báo đơn hàng và tồn kho trên thiết bị này"
        action={
          <AppBadge color={copy.color} variant="soft">
            {copy.badge}
          </AppBadge>
        }
      />
      <AppCard noPadding className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center gap-3 px-4 py-4">
            <IonSpinner name="crescent" className="text-base" />
            <p className="text-sm text-gray-500">Đang kiểm tra thiết bị...</p>
          </div>
        ) : (
          <SettingToggleRow
            label="Nhận thông báo đẩy"
            description={STATUS_DESCRIPTION[status]}
            checked={status === "subscribed"}
            disabled={!canToggle || isToggling}
            onChange={(checked) => void handleToggle(checked)}
          />
        )}

        {error && (
          <p className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {error}
          </p>
        )}

        {status === "subscribed" && (
          <div className="px-4 py-3 border-t border-gray-100">
            <AppButton
              variant="outline"
              fullWidth
              size="small"
              loading={isTesting}
              loadingText="Đang gửi..."
              onClick={() => void handleSendTest()}
              icon={<IonIcon icon={sendOutline} className="text-base" />}
            >
              Gửi thông báo thử
            </AppButton>
          </div>
        )}

        <div className="px-4 py-3 bg-blue-50/50 border-t border-gray-100">
          <p className="text-xs text-blue-700 leading-relaxed">
            Xem danh sách thông báo tại mục <strong>Thông báo</strong> trên thanh
            điều hướng bên trái.
          </p>
        </div>
      </AppCard>
    </>
  );
};

export default NotificationSection;
