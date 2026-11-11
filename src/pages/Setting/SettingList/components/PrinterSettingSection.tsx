import React, { useState } from "react";
import { IonIcon } from "@ionic/react";
import { printOutline, settingsOutline, wifiOutline } from "ionicons/icons";
import AppBadge from "@/components/UI/AppBadge";
import AppButton from "@/components/UI/AppButton";
import AppCard from "@/components/UI/AppCard";
import AppListItem from "@/components/UI/AppListItem";
import { useCustomToast } from "@/hooks/useCustomToast";
import { createXprinterService } from "@/helpers/printerService";
import SectionHeader from "./SectionHeader";
import {
  BarcodeLayoutOption,
  PrinterConnectionState,
  PrinterSettings,
} from "../types";

const LAYOUT_LABELS: Record<BarcodeLayoutOption, string> = {
  "auto-pair": "Tự động ghép đôi (2 tem/khổ)",
  single: "Một tem mỗi khổ",
};

const STATUS_META: Record<
  PrinterConnectionState,
  { label: string; badge: string; dot: string }
> = {
  idle: {
    label: "Chưa kiểm tra",
    badge: "medium",
    dot: "bg-gray-400",
  },
  testing: {
    label: "Đang kiểm tra kết nối",
    badge: "warning",
    dot: "bg-amber-500",
  },
  connected: {
    label: "Đã kết nối",
    badge: "success",
    dot: "bg-emerald-500",
  },
  error: {
    label: "Mất kết nối",
    badge: "danger",
    dot: "bg-red-500",
  },
};

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <AppListItem showChevron={false}>
    <div className="flex items-center justify-between w-full gap-3">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-sm font-medium text-gray-900 text-right break-all">
        {value}
      </p>
    </div>
  </AppListItem>
);

interface PrinterSettingSectionProps {
  settings: PrinterSettings;
  onOpenConfig: () => void;
}

const PrinterSettingSection: React.FC<PrinterSettingSectionProps> = ({
  settings,
  onOpenConfig,
}) => {
  const [connectionState, setConnectionState] =
    useState<PrinterConnectionState>("idle");
  const [isTesting, setIsTesting] = useState(false);
  const { showSuccess, showError } = useCustomToast();
  const status = STATUS_META[connectionState];

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionState("testing");

    try {
      const service = createXprinterService({
        ipAddress: settings.ipAddress,
        port: settings.port,
        timeout: settings.timeout,
      });
      const result = await service.testConnection();

      if (result.isConnected) {
        setConnectionState("connected");
        await showSuccess(
          `Đã kết nối máy in ${result.printerModel ?? "XP 365B"}`
        );
        return;
      }

      setConnectionState("error");
      await showError(
        result.errorMessage ?? "Không thể kết nối máy in. Kiểm tra lại IP/Port."
      );
    } catch (error) {
      setConnectionState("error");
      await showError(
        (error as Error).message || "Không thể kiểm tra kết nối máy in"
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <>
      <SectionHeader
        icon={printOutline}
        title="Máy in tem mã vạch"
        description="Kết nối máy in qua mạng LAN nội bộ"
        action={
          <AppBadge color={status.badge} variant="soft">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`}
            />
            {status.label}
          </AppBadge>
        }
      />

      <AppCard noPadding className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <IonIcon icon={wifiOutline} className="text-gray-400 text-base" />
          <p className="text-sm text-gray-600">Địa chỉ máy in hiện tại</p>
          <p className="ml-auto text-sm font-semibold text-gray-900">
            {settings.ipAddress}:{settings.port}
          </p>
        </div>

        <InfoRow label="Cổng kết nối" value={String(settings.port)} />
        <InfoRow label="Bố cục tem" value={LAYOUT_LABELS[settings.barcodeLayout]} />
        <InfoRow
          label="Khổ giấy in tem"
          value={`${settings.paperWidth} × ${settings.paperHeight} mm (mặc định)`}
        />
        <InfoRow label="Thời gian chờ" value={`${settings.timeout} ms`} />

        <div className="flex items-center gap-2 px-4 py-3">
          <AppButton
            variant="primary"
            fullWidth
            loading={isTesting}
            loadingText="Đang kiểm tra..."
            onClick={() => void testConnection()}
            icon={<IonIcon icon={printOutline} className="text-base" />}
          >
            In thử / Test kết nối
          </AppButton>
          <AppButton
            variant="outline"
            onClick={onOpenConfig}
            aria-label="Cấu hình máy in"
            icon={<IonIcon icon={settingsOutline} className="text-base" />}
          >
            Cấu hình
          </AppButton>
        </div>
      </AppCard>
    </>
  );
};

export default PrinterSettingSection;
