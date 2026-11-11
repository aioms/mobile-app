import React from "react";
import { IonIcon } from "@ionic/react";

interface InfoRowProps {
  icon: string;
  label: string;
  value?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div className="flex w-full items-start gap-3">
    <IonIcon icon={icon} className="mt-0.5 shrink-0 text-lg text-gray-400" />
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="break-words text-sm font-medium text-gray-900">
        {value || "Chưa cập nhật"}
      </p>
    </div>
  </div>
);

export default InfoRow;
