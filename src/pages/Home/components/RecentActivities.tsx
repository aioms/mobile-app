import { useCallback, useMemo, useState } from "react";
import { IonIcon, useIonViewWillEnter } from "@ionic/react";
import { useHistory } from "react-router-dom";
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
import { getActivityRoute } from "@/helpers/activity";
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
  const history = useHistory();
  const { getRecentActivities } = useActivity();
  const [activities, setActivities] = useState<RecentActivityItemDto[]>([]);
  const [metadata, setMetadata] = useState<PaginationMetadataDto>(INITIAL_METADATA);
  const [page, setPage] = useState<number>(DEFAULT_QUERY.page);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchRecentActivities = useCallback(async (targetPage: number) => {
    setIsLoading(true);

    try {
      const response = await getRecentActivities({
        page: targetPage,
        limit: DEFAULT_QUERY.limit,
      });

      setActivities(response.data || []);
      setMetadata(response.metadata || INITIAL_METADATA);
    } finally {
      setIsLoading(false);
    }
  }, [getRecentActivities]);

  useIonViewWillEnter(() => {
    void fetchRecentActivities(page);
  }, [fetchRecentActivities, page]);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    void fetchRecentActivities(nextPage);
  };

  const canGoPrevious = metadata.hasPrevious;
  const canGoNext = metadata.hasNext;

  const activityRows = useMemo(
    () =>
      activities.map((activity) => ({
        ...activity,
        route: getActivityRoute(activity),
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
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-800">Hoạt động mới nhất</h2>
        {isLoading && (
          <span className="text-xs text-gray-400 animate-pulse">Đang cập nhật...</span>
        )}
      </div>

      {!isLoading && activityRows.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-400">Chưa có hoạt động gần đây.</div>
      ) : null}

      <div className="divide-y divide-gray-100 mb-4">
        {activityRows.map((activity) => {
          const content = (
            <>
              <div className="bg-blue-50/80 text-blue-600 p-2 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5">
                <IonIcon icon={activity.icon} className="text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                  <span className="font-semibold text-gray-900">
                    {activity.fullname || activity.username}
                  </span>{" "}
                  <span>{activity.description}</span>
                </p>
                <span className="text-gray-400 text-xs mt-1 block font-medium">
                  {activity.time}
                </span>
              </div>
            </>
          );

          return activity.route ? (
            <button
              key={activity.id}
              type="button"
              className="w-full min-h-11 flex items-start gap-3 py-3 first:pt-0 last:pb-0 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => activity.route && history.push(activity.route)}
            >
              {content}
            </button>
          ) : (
            <div
              key={activity.id}
              className="min-h-11 flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              {content}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
          disabled={!canGoPrevious || isLoading}
          onClick={() => changePage(Math.max(1, page - 1))}
        >
          Trước
        </button>
        <div className="text-xs text-gray-500 text-center">
          <span className="font-medium text-gray-700">Trang {metadata.currentPage}/{Math.max(metadata.totalPages, 1)}</span>
          <span className="mx-1 text-gray-300">•</span>
          <span>{metadata.totalItems} hoạt động</span>
        </div>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
          disabled={!canGoNext || isLoading}
          onClick={() => changePage(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default RecentActivities;
