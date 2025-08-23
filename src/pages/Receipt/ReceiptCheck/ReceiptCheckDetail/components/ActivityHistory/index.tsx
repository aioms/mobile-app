import { dayjsFormat } from "@/helpers/formatters";
import { useState } from "react";

export interface ActivityLog {
  user: string;
  action: string;
  timestamp: string;
}

type Props = {
  activityLog: ActivityLog[];
};

const LIMIT = 5;

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
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b">
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
      <div className="divide-y">
        {displayedLogs.map((activity, index) => (
          <div
            key={index}
            className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50"
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
              <span className="text-sm text-gray-600">{activity.action}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Xem thêm
          </button>
        </div>
      )}
    </>
  );
}
