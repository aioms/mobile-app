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
  refundTotal: number;
  operatingExpense: number;
  dailyProfit: number;
  warnings: string[];
  breakdown: RevenueBreakdown;
}

export interface DailyRevenueResponse {
  success: boolean;
  data: DailyRevenueData;
  statusCode: number;
}
