import React from "react";
import { IonIcon } from "@ionic/react";

interface SectionHeaderProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
    <div className="flex items-start gap-2 min-w-0">
      <IonIcon icon={icon} className="text-blue-600 text-lg mt-0.5 shrink-0" />
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default SectionHeader;
