import { request } from "../../helpers/axios";
import { DailyRevenueData } from "@/types/aggregate";

const useAggregate = () => {
  const getDailyRevenue = async (date?: string): Promise<DailyRevenueData> => {
    const query = new URLSearchParams();

    if (date) {
      query.append("date", date);
    }

    const response = await request.get(
      `/revenue/daily${query.toString() ? `?${query.toString()}` : ""}`
    );
    return response.data;
  };

  return {
    getDailyRevenue,
  };
};

export default useAggregate;
