import { useCallback, useEffect, useMemo, useState } from "react";
import { IonIcon } from "@ionic/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/vi";
import {
  checkmarkCircle,
  cubeOutline,
  pricetagOutline,
  cardOutline,
} from "ionicons/icons";

import useActivity from "@/hooks/apis/useActivity";
import {
  GetRecentActivitiesQueryDto,
  PaginationMetadataDto,
  RecentActivityItemDto,
  UserActivityType,
} from "@/types/activity.type";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");

const DEFAULT_QUERY: Required<GetRecentActivitiesQueryDto> = {
  page: 1,
  limit: 10,
};

const INITIAL_METADATA: PaginationMetadataDto = {
  offset: 0,
  limit: DEFAULT_QUERY.limit,
  totalItems: 0,
  totalPages: 0,
  currentPage: DEFAULT_QUERY.page,
  hasNext: false,
  hasPrevious: false,
};

const ACTIVITY_ICON_MAP: Partial<Record<UserActivityType, string>> = {
  [UserActivityType.ORDER_COMPLETED]: checkmarkCircle,
  [UserActivityType.PRODUCT_COST_PRICE_CHANGE]: pricetagOutline,
  [UserActivityType.PRODUCT_SELLING_PRICE_CHANGE]: pricetagOutline,
  [UserActivityType.RECEIPT_IMPORT_CREATED]: cubeOutline,
  [UserActivityType.RECEIPT_IMPORT_COMPLETED]: cubeOutline,
  [UserActivityType.RECEIPT_CHECK_CREATED]: cubeOutline,
  [UserActivityType.RECEIPT_CHECK_BALANCED]: cubeOutline,
  [UserActivityType.RECEIPT_DEBT_CREATED]: cardOutline,
  [UserActivityType.RECEIPT_DEBT_UPDATED]: cardOutline,
  [UserActivityType.RECEIPT_DEBT_PAID]: cardOutline,
};

const RecentActivities: React.FC = () => {
  const { getRecentActivities } = useActivity();
  const [activities, setActivities] = useState<RecentActivityItemDto[]>([]);
  const [metadata, setMetadata] = useState<PaginationMetadataDto>(INITIAL_METADATA);
  const [page, setPage] = useState<number>(DEFAULT_QUERY.page);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchRecentActivities = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getRecentActivities({
        page,
        limit: DEFAULT_QUERY.limit,
      });

      setActivities(response.data || []);
      setMetadata(response.metadata || INITIAL_METADATA);
    } finally {
      setIsLoading(false);
    }
  }, [getRecentActivities, page]);

  useEffect(() => {
    fetchRecentActivities();
  }, [fetchRecentActivities]);

  const canGoPrevious = metadata.hasPrevious;
  const canGoNext = metadata.hasNext;

  const activityRows = useMemo(
    () =>
      activities.map((activity) => ({
        ...activity,
        icon:
          ACTIVITY_ICON_MAP[activity.type as UserActivityType] || checkmarkCircle,
        time: dayjs
          .utc(activity.createdAt)
          .tz("Asia/Ho_Chi_Minh")
          .fromNow(),
      })),
    [activities]
  );

  return (
    <div className="mb-6">
      <h2 className="text-base font-bold mb-3">Hoạt động mới nhất</h2>

      {isLoading ? (
        <div className="text-sm text-gray-500">Đang tải hoạt động...</div>
      ) : null}

      {!isLoading && activityRows.length === 0 ? (
        <div className="text-sm text-gray-500">Chưa có hoạt động gần đây.</div>
      ) : null}

      <div className="space-y-3 mb-4">
        {activityRows.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3">
            <div className="bg-blue-50 p-1.5 rounded-lg">
              <IonIcon icon={activity.icon} className="text-blue-500 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm">{activity.fullname || activity.username} {activity.description}</h3>
              <span className="text-gray-500 text-xs">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
          disabled={!canGoPrevious || isLoading}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Trước
        </button>
        <div className="text-xs text-gray-500 text-center">
          <div>
            Trang {metadata.currentPage}/{Math.max(metadata.totalPages, 1)}
          </div>
          <div>Tổng {metadata.totalItems} hoạt động</div>
        </div>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
          disabled={!canGoNext || isLoading}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default RecentActivities;
