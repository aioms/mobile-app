import React from "react";
import { IonToggle } from "@ionic/react";
import AppListItem from "@/components/UI/AppListItem";

interface SettingToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const SettingToggleRow: React.FC<SettingToggleRowProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => (
  <AppListItem showChevron={false}>
    <div className="flex items-center justify-between w-full gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <IonToggle
        mode="ios"
        className="shrink-0"
        checked={checked}
        disabled={disabled}
        onIonChange={(event) => onChange(event.detail.checked)}
      />
    </div>
  </AppListItem>
);

export default SettingToggleRow;
