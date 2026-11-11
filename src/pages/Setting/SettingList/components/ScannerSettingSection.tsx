import React from "react";
import { barcodeOutline } from "ionicons/icons";
import AppCard from "@/components/UI/AppCard";
import { playScanBeep } from "@/helpers/deviceSettingsStorage";
import SectionHeader from "./SectionHeader";
import SettingToggleRow from "./SettingToggleRow";
import { ScannerSettings } from "../types";

interface ScannerSettingSectionProps {
  settings: ScannerSettings;
  onChange: (patch: Partial<ScannerSettings>) => void;
}

const ScannerSettingSection: React.FC<ScannerSettingSectionProps> = ({
  settings,
  onChange,
}) => {
  const handleHapticsChange = async (enabled: boolean) => {
    onChange({ hapticsEnabled: enabled });
    if (!enabled) return;

    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Device without a haptics motor; the preference is still saved.
    }
  };

  const handleSoundChange = (enabled: boolean) => {
    onChange({ soundEnabled: enabled });
    if (enabled) playScanBeep();
  };

  return (
    <>
      <SectionHeader
        icon={barcodeOutline}
        title="Máy quét mã vạch"
        description="Phản hồi khi quét mã thành công"
      />
      <AppCard noPadding className="overflow-hidden">
        <SettingToggleRow
          label="Rung khi quét mã"
          description="Thiết bị rung nhẹ mỗi lần quét thành công"
          checked={settings.hapticsEnabled}
          onChange={(checked) => void handleHapticsChange(checked)}
        />
        <SettingToggleRow
          label="Âm thanh khi quét"
          description="Phát tiếng bíp xác nhận sau mỗi lần quét"
          checked={settings.soundEnabled}
          onChange={handleSoundChange}
        />
      </AppCard>
    </>
  );
};

export default ScannerSettingSection;
