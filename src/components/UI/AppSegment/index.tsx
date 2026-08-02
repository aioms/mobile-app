import React from "react";
import { IonSegment, IonSegmentButton, IonLabel } from "@ionic/react";

export interface AppSegmentTab {
  value: string;
  label: string;
}

interface AppSegmentProps {
  tabs: AppSegmentTab[];
  value: string;
  onIonChange: (value: string) => void;
  className?: string;
}

const AppSegment: React.FC<AppSegmentProps> = ({
  tabs,
  value,
  onIonChange,
  className = "",
}) => {
  return (
    <div className={`bg-white ${className}`}>
      <IonSegment
        mode="ios"
        value={value}
        onIonChange={(e) => onIonChange(e.detail.value as string)}
      >
        {tabs.map((tab) => (
          <IonSegmentButton key={tab.value} value={tab.value} className="min-h-[2.5rem]">
            <IonLabel className="font-medium tracking-wide text-sm">{tab.label}</IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>
    </div>
  );
};

export default AppSegment;
