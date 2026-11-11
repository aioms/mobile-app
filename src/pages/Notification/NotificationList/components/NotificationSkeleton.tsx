import React from "react";
import { IonSkeletonText } from "@ionic/react";

interface NotificationSkeletonProps {
  count?: number;
}

const NotificationSkeleton: React.FC<NotificationSkeletonProps> = ({
  count = 5,
}) => {
  return (
    <div className="space-y-3 px-4 py-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden">
            <IonSkeletonText animated className="w-full h-full !m-0" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <IonSkeletonText
                animated
                style={{ width: `${60 + (index % 3) * 15}%` }}
                className="h-4 !m-0 rounded"
              />
              <IonSkeletonText
                animated
                style={{ width: "45px" }}
                className="h-3 !m-0 rounded"
              />
            </div>
            <IonSkeletonText
              animated
              style={{ width: "90%" }}
              className="h-3 !m-0 rounded"
            />
            <IonSkeletonText
              animated
              style={{ width: "65%" }}
              className="h-3 !m-0 rounded"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSkeleton;
