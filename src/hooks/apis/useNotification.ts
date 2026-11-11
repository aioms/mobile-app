import { useCallback } from "react";
import { request } from "../../helpers/axios";
import type { IHttpResponse } from "@/types/index.d";
import type {
  GetNotificationsQueryDto,
  NotificationItemDto,
  UnreadCountResponseDto,
} from "@/types/notification.type";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;

const useNotification = () => {
  const getNotifications = useCallback(
    async (
      params: GetNotificationsQueryDto = {}
    ): Promise<IHttpResponse<NotificationItemDto[]>> => {
      const query = new URLSearchParams({
        page: String(params.page ?? DEFAULT_PAGE),
        limit: String(params.limit ?? DEFAULT_LIMIT),
      });

      if (params.status) {
        query.set("status", params.status);
      }

      const response: IHttpResponse<NotificationItemDto[]> = await request.get(
        `/notifications?${query.toString()}`
      );
      return response;
    },
    []
  );

  const getUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const response: IHttpResponse<UnreadCountResponseDto> = await request.get(
        "/notifications/unread-count"
      );
      return response.data?.count ?? 0;
    } catch {
      return 0;
    }
  }, []);

  const markAsRead = useCallback(
    async (id: string): Promise<IHttpResponse<NotificationItemDto>> => {
      const response: IHttpResponse<NotificationItemDto> = await request.patch(
        `/notifications/${id}/read`
      );
      return response;
    },
    []
  );

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      await request.post("/notifications/read-all");
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};

export default useNotification;
