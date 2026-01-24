export interface RevenueBreakdown {
  [key: string]: number;
}

export interface DailyRevenueData {
  date: string;
  orderCost: number;
  debtCost: number;
  totalCost: number;
  totalRevenue: number;
  grossProfit: number;
  breakdown: RevenueBreakdown;
}

export interface DailyRevenueResponse {
  success: boolean;
  data: DailyRevenueData;
  statusCode: number;
}
