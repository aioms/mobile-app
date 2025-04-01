import { dayjsFormat } from "@/helpers/formatters";

export interface ActivityLog {
  user: string;
  action: string;
  timestamp: string;
}

type Props = {
  activityLog: ActivityLog[];
};

export default function ActivityHistory({ activityLog }: Props) {
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
        {activityLog.map((activity, index) => (
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
    </>
  );
}
