import { request } from "../../helpers/axios";
import type { IHttpResponse } from "@/types/index.d";
import { DailyRevenueData } from "@/types/aggregate";

type AggregateResponse = IHttpResponse<DailyRevenueData> & {
  error?: string;
};

const useAggregate = () => {
  const getDailyRevenue = async (date?: string): Promise<DailyRevenueData> => {
    const query = new URLSearchParams();

    if (date) {
      query.append("date", date);
    }

    const response: AggregateResponse = await request.get(
      `/revenue/daily${query.toString() ? `?${query.toString()}` : ""}`
    );

    if (!response?.success || !response.data) {
      throw new Error(
        response?.error ||
          response?.message ||
          "Không thể tải doanh thu trong ngày"
      );
    }

    return response.data;
  };

  return {
    getDailyRevenue,
  };
};

export default useAggregate;
