import { request } from "../../helpers/axios";
import { useCallback } from "react";
import type { IHttpResponse } from "@/types/index.d";
import type {
  GetRecentActivitiesQueryDto,
  GetRecentActivitiesResponseDto,
  RecentActivityItemDto,
} from "@/types/activity.type";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const useActivity = () => {
  const getRecentActivities = useCallback(
    async (
      params: GetRecentActivitiesQueryDto = {}
    ): Promise<GetRecentActivitiesResponseDto> => {
      const query = new URLSearchParams({
        page: String(params.page ?? DEFAULT_PAGE),
        limit: String(params.limit ?? DEFAULT_LIMIT),
      });

      const response: IHttpResponse<RecentActivityItemDto[]> = await request.get(
        `/activities/recent?${query.toString()}`
      );

      return response as GetRecentActivitiesResponseDto;
    },
    []
  );

  return {
    getRecentActivities,
  };
};

export default useActivity;
