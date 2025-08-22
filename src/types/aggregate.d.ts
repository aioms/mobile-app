export interface RevenueBreakdown {
  [key: string]: number;
}

export interface DailyRevenueData {
  date: string;
  totalRevenue: number;
  breakdown: RevenueBreakdown;
}

export interface DailyRevenueResponse {
  success: boolean;
  data: DailyRevenueData;
  statusCode: number;
}