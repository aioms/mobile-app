import { dayjsFormat } from "@/helpers/formatters";
import { useState } from "react";
import { AppButton } from "@/components/UI";
import { RECEIPT_CHECK_REASONS, RECEIPT_CHECK_STATUS, getStatusLabel, TReceiptCheckStatus } from "@/common/constants/receipt-check.constant";

export interface ActivityLog {
  user: string;
  action: string;
  timestamp: string;
}

type Props = {
  activityLog: ActivityLog[];
};

const LIMIT = 5;

const translateAction = (action: string) => {
  if (!action) return action;
  
  let translated = action;

  // Replace standard backend terms
  translated = translated.replace(/Admin đã thay đổi lý do thành/gi, "Đã thay đổi lý do thành");
  translated = translated.replace(/Admin đã thay đổi ghi chú/gi, "Đã cập nhật ghi chú");
  translated = translated.replace(/Admin đã thay đổi trạng thái/gi, "Đã thay đổi trạng thái");

  // Replace statuses
  Object.values(RECEIPT_CHECK_STATUS).forEach((status) => {
    if (translated.includes(status)) {
      translated = translated.replace(status, getStatusLabel(status as TReceiptCheckStatus).toLowerCase());
    }
  });

  // Replace reasons
  RECEIPT_CHECK_REASONS.forEach((reason) => {
    if (translated.includes(reason.value)) {
      let label = reason.label.toLowerCase();
      if (reason.value === "other") label = "khác";
      translated = translated.replace(reason.value, label);
    }
  });

  return translated;
};

export default function ActivityHistory({ activityLog }: Props) {
  const [displayLimit, setDisplayLimit] = useState(LIMIT);

  const displayedLogs = activityLog.slice(0, displayLimit);
  const hasMore = activityLog.length > displayLimit;

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + LIMIT);
  };

  return (
    <>
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="col-span-3">
          <span className="text-sm font-medium text-gray-600">Ngày</span>
        </div>
        <div className="col-span-3">
          <span className="text-sm font-medium text-gray-600">Giờ</span>
        </div>
        <div className="col-span-6">
          <span className="text-sm font-medium text-gray-600">
            Chi tiết tác vụ
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="divide-y divide-gray-100">
        {displayedLogs.map((activity, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50/50"
          >
            <div className="col-span-3">
              <span className="text-sm text-gray-600">
                {dayjsFormat(activity.timestamp)}
              </span>
            </div>
            <div className="col-span-3">
              <span className="text-sm text-gray-600">
                {dayjsFormat(activity.timestamp, "HH:mm")}
              </span>
            </div>
            <div className="col-span-6">
              <span className="text-sm text-gray-600 leading-relaxed">{translateAction(activity.action)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <AppButton
            variant="pill"
            onClick={handleLoadMore}
          >
            Xem thêm
          </AppButton>
        </div>
      )}
    </>
  );
}
