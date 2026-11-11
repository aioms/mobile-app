import React, { useEffect, useRef, useState } from "react";
import { IonIcon } from "@ionic/react";
import {
  callOutline,
  informationCircleOutline,
  refreshOutline,
} from "ionicons/icons";
import AppBadge from "@/components/UI/AppBadge";
import AppButton from "@/components/UI/AppButton";
import AppCard from "@/components/UI/AppCard";
import AppListItem from "@/components/UI/AppListItem";
import { useAppUpdate } from "@/pwa";
import { useCustomToast } from "@/hooks/useCustomToast";
import SectionHeader from "./SectionHeader";

const SUPPORT_HOTLINE = import.meta.env.VITE_SUPPORT_HOTLINE?.trim() ?? "";

const InfoRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <AppListItem showChevron={false}>
    <div className="flex items-center justify-between w-full gap-3">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-sm font-medium text-gray-900 text-right">{value}</p>
    </div>
  </AppListItem>
);

const AppInfoSection: React.FC = () => {
  const { currentVersion, isUpdateAvailable, error, checkForUpdate } =
    useAppUpdate();
  const { showSuccess, showInfo, showError } = useCustomToast();
  const [isChecking, setIsChecking] = useState(false);
  const latest = useRef({ isUpdateAvailable, error });

  useEffect(() => {
    latest.current = { isUpdateAvailable, error };
  }, [isUpdateAvailable, error]);

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    try {
      await checkForUpdate();
      if (latest.current.error) {
        await showError(latest.current.error);
      } else if (latest.current.isUpdateAvailable) {
        await showInfo("Có bản cập nhật mới. Chọn “Cập nhật” để áp dụng.");
      } else {
        await showSuccess("Bạn đang dùng phiên bản mới nhất.");
      }
    } catch (checkError) {
      await showError(
        (checkError as Error).message || "Không thể kiểm tra cập nhật"
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleCallSupport = async () => {
    const dialable = SUPPORT_HOTLINE.replace(/[^\d+]/g, "");
    if (!dialable) {
      await showInfo("Hotline hỗ trợ đang được cập nhật.");
      return;
    }
    window.location.href = `tel:${dialable}`;
  };

  return (
    <>
      <SectionHeader
        icon={informationCircleOutline}
        title="Về ứng dụng AIOM"
        description="Thông tin phiên bản và hỗ trợ kỹ thuật"
        action={
          <AppBadge
            color={isUpdateAvailable ? "warning" : "success"}
            variant="soft"
          >
            {isUpdateAvailable ? "Có bản cập nhật" : "Mới nhất"}
          </AppBadge>
        }
      />
      <AppCard noPadding className="overflow-hidden">
        <InfoRow
          label="Phiên bản ứng dụng"
          value={`v${currentVersion.version}`}
        />
        <InfoRow
          label="Bản dựng"
          value={`#${currentVersion.buildNumber} • ${currentVersion.commit.slice(
            0,
            7
          )}`}
        />
        <InfoRow label="Kênh phát hành" value={currentVersion.environment} />

        <div className="px-4 py-3 border-b border-gray-100">
          <AppButton
            variant="secondary"
            fullWidth
            loading={isChecking}
            loadingText="Đang kiểm tra..."
            onClick={() => void handleCheckUpdate()}
            icon={<IonIcon icon={refreshOutline} className="text-base" />}
          >
            Kiểm tra cập nhật
          </AppButton>
        </div>

        <AppListItem onClick={() => void handleCallSupport()}>
          <div className="flex items-center gap-3 w-full">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <IonIcon icon={callOutline} className="text-blue-600 text-lg" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                Hotline hỗ trợ kỹ thuật AIOM
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {SUPPORT_HOTLINE || "Chưa cấu hình hotline"}
              </p>
            </div>
          </div>
        </AppListItem>

        <p className="px-4 py-3 text-center text-xs text-gray-400">
          AIOM System · Quản lý bán hàng và kho hiệu quả
        </p>
      </AppCard>
    </>
  );
};

export default AppInfoSection;
