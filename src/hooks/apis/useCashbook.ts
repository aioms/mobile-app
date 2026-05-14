import { useCallback } from "react";

import { request } from "../../helpers/axios";

import type { IHttpResponse } from "@/types";
import type {
  CashbookDailyBalanceQueryDto,
  CashbookDailyBalanceResponseDto,
  CashbookOverviewQueryDto,
  CashbookOverviewResponseDto,
  UpdateCashbookActualCashRequestDto,
  UpdateCashbookActualCashResponseDto,
  UpdateCashbookCashForDayRequestDto,
  UpdateCashbookCashForDayResponseDto,
} from "@/types/cashbook.type";

const useCashbook = () => {
  const getOverview = useCallback(async (
    params: CashbookOverviewQueryDto,
  ): Promise<CashbookOverviewResponseDto> => {
    const query = new URLSearchParams({
      range: params.range,
      date: params.date,
    });

    const response: IHttpResponse<CashbookOverviewResponseDto> = await request.get(
      `/cashbook/overview?${query.toString()}`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Không thể tải báo cáo tổng quan");
    }

    return response.data;
  }, []);

  const getDailyBalance = useCallback(async (
    params: CashbookDailyBalanceQueryDto,
  ): Promise<CashbookDailyBalanceResponseDto> => {
    const query = new URLSearchParams({
      date: params.date,
    });

    const response: IHttpResponse<CashbookDailyBalanceResponseDto> =
      await request.get(`/cashbook/daily-balance?${query.toString()}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Không thể tải quỹ tiền mặt");
    }

    return response.data;
  }, []);

  const updateActualCash = useCallback(async (
    payload: UpdateCashbookActualCashRequestDto,
  ): Promise<UpdateCashbookActualCashResponseDto> => {
    const response: IHttpResponse<UpdateCashbookActualCashResponseDto> =
      await request.put(`/cashbook/daily-balance/actual-cash`, payload);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Không thể cập nhật tiền mặt thực tế");
    }

    return response.data;
  }, []);

  const updateCashForDay = useCallback(async (
    payload: UpdateCashbookCashForDayRequestDto,
  ): Promise<UpdateCashbookCashForDayResponseDto> => {
    const response: IHttpResponse<UpdateCashbookCashForDayResponseDto> =
      await request.put(`/cashbook/daily-balance/cash-for-day`, payload);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Không thể cập nhật tiền đầu ngày");
    }

    return response.data;
  }, []);

  return {
    getOverview,
    getDailyBalance,
    updateActualCash,
    updateCashForDay,
  };
};

export default useCashbook;
