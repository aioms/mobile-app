import React, { useEffect, useState } from "react";
import { IonAlert, IonIcon } from "@ionic/react";
import { cloudOfflineOutline, trashOutline } from "ionicons/icons";
import AppButton from "@/components/UI/AppButton";
import AppCard from "@/components/UI/AppCard";
import { useStorage } from "@/hooks";
import { useCustomToast } from "@/hooks/useCustomToast";
import { formatFileSize } from "@/helpers/imageCompression";
import SectionHeader from "./SectionHeader";

interface StorageEstimate {
  usedBytes: number;
  quotaBytes: number;
}

const StorageAndCacheSection: React.FC = () => {
  const { storage } = useStorage();
  const { showSuccess, showError } = useCustomToast();
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearAlert, setShowClearAlert] = useState(false);

  useEffect(() => {
    const loadEstimate = async () => {
      if (!navigator.storage?.estimate) return;
      try {
        const result = await navigator.storage.estimate();
        setEstimate({
          usedBytes: result.usage ?? 0,
          quotaBytes: result.quota ?? 0,
        });
      } catch (error) {
        console.error("Không thể ước tính dung lượng lưu trữ:", error);
      }
    };

    void loadEstimate();
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await storage.clear();
      await showSuccess("Đã xóa dữ liệu đệm. Đang tải lại ứng dụng...");
      window.setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      setIsClearing(false);
      await showError(
        (error as Error).message || "Không thể xóa dữ liệu đệm"
      );
    }
  };

  const usagePercent =
    estimate && estimate.quotaBytes > 0
      ? Math.min(100, (estimate.usedBytes / estimate.quotaBytes) * 100)
      : 0;

  const usageLabel = estimate
    ? `${formatFileSize(estimate.usedBytes)}${
        estimate.quotaBytes > 0
          ? ` / ${formatFileSize(estimate.quotaBytes)}`
          : ""
      }`
    : "Đang tính toán...";

  return (
    <>
      <SectionHeader
        icon={cloudOfflineOutline}
        title="Bộ nhớ & Dữ liệu"
        description="Quản lý dung lượng lưu trữ và dữ liệu tạm trên thiết bị"
      />
      <AppCard noPadding className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">Dung lượng lưu trữ offline</p>
            <p className="text-sm font-medium text-gray-900">{usageLabel}</p>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>


        <div className="px-4 py-3">
          <AppButton
            variant="outline"
            fullWidth
            loading={isClearing}
            loadingText="Đang xóa..."
            onClick={() => setShowClearAlert(true)}
            className="!text-red-600 !border-red-200 !bg-red-50"
            icon={<IonIcon icon={trashOutline} className="text-base" />}
          >
            Xóa dữ liệu đệm
          </AppButton>
          <p className="text-xs text-gray-500 mt-2">
            Chỉ xóa dữ liệu tạm trên thiết bị. Dữ liệu trên máy chủ không bị ảnh
            hưởng.
          </p>
        </div>
      </AppCard>

      <IonAlert
        isOpen={showClearAlert}
        onDidDismiss={() => setShowClearAlert(false)}
        header="Xóa dữ liệu đệm?"
        message="Toàn bộ dữ liệu lưu trên thiết bị (bao gồm phiên đăng nhập) sẽ bị xóa và ứng dụng sẽ tải lại. Bạn cần đăng nhập lại sau khi xóa."
        buttons={[
          { text: "Hủy", role: "cancel" },
          {
            text: "Xóa dữ liệu",
            role: "destructive",
            handler: () => {
              void handleClearCache();
            },
          },
        ]}
      />
    </>
  );
};

export default StorageAndCacheSection;
