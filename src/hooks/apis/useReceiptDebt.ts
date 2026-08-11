import { IHttpResponse } from "@/types";
import { PayDebtRequestDto } from "@/types/payment.type";
import { TransactionListResponse } from "@/types/transaction.type";
import { CancelReceiptDebtRequestDto } from "@/types/receipt-debt.type";
import { request } from "../../helpers/axios";
import { buildQueryString } from "../../helpers/common";

const PREFIX_PATH = "receipt-debt";

const useReceiptDebt = () => {
  const getList = async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10,
  ) => {
    const queryString = buildQueryString(filters, page, limit);

    const response: IHttpResponse = await request.get(
      `/${PREFIX_PATH}?${queryString}`,
    );
    return response;
  };

  const getDetail = async (id: string) => {
    const response = await request.get(`/${PREFIX_PATH}/${id}`);
    return response.data;
  };

  const create = async (data: any, requestId?: string) => {
    const response: IHttpResponse = await request.post(`/${PREFIX_PATH}`, data, {
      headers: requestId ? { "X-Request-ID": requestId } : undefined,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to create receipt debt");
    }

    return response.data;
  };

  const update = async (id: string, data: any) => {
    const response: IHttpResponse = await request.put(
      `/${PREFIX_PATH}/${id}`,
      data,
    );

    if (!response.success) {
      throw new Error(response.message || "Failed to update receipt debt");
    }

    return response.data;
  };

  const remove = async (id: string) => {
    const response = await request.delete(`/${PREFIX_PATH}/${id}`);
    return response.data;
  };

  const updateInventoryForNewPeriod = async (id: string, payload: {
    items: Array<{
      productId: string;
      productName: string;
      productCode: number;
      quantity: number;
      originalQuantity: number;
      costPrice: number;
      receiptPeriodId?: string;
      shipNow?: boolean;
    }>;
    dueDate?: string;
    note?: string;
    vatAmount?: number;
  }) => {
    const response: IHttpResponse = await request.patch(
      `/${PREFIX_PATH}/${id}/inventory/update`,
      payload,
    );

    if (!response.success) {
      throw new Error(
        response.message || "Failed to update inventory for new period",
      );
    }

    return response;
  };

  const payDebt = async (id: string, paymentData: PayDebtRequestDto) => {
    try {
      const response: IHttpResponse = await request.post(
        `/${PREFIX_PATH}/${id}/payment`,
        paymentData,
      );
      return response;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Payment failed",
      );
    }
  };

  const getPaymentTransactions = async (
    id: string,
  ): Promise<TransactionListResponse> => {
    const response: IHttpResponse = await request.get(
      `/${PREFIX_PATH}/${id}/payment`,
    );

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch payment transactions",
      );
    }

    return response.data;
  };

  const updateReceiptPeriod = async (
    debtId: string,
    periodId: string,
    payload: {
      vatAmount?: number;
      items?: Array<{
        receiptItemId: string;
        quantity: number;
        costPrice: number;
      }>;
    },
  ) => {
    try {
      const response: IHttpResponse = await request.patch(
        `/${PREFIX_PATH}/${debtId}/period/${periodId}`,
        payload,
      );

      if (response && typeof response === "object" && "success" in response) {
        if (!response.success) {
          const errorMessage = response.message ||
            "Failed to update receipt period";
          throw new Error(errorMessage);
        }
      }

      return response.data || response;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      if (error && typeof error === "object" && "message" in error) {
        throw new Error(error.message as string);
      }

      throw new Error("Failed to update receipt period");
    }
  };

  const cancelReceiptDebt = async (receiptId: string, note?: string) => {
    const cancelData: CancelReceiptDebtRequestDto = { note };
    const response: IHttpResponse = await request.patch(
      `/${PREFIX_PATH}/${receiptId}/cancel`,
      cancelData,
    );

    if (response.statusCode !== 200 || !response.success) {
      throw new Error(response.message || "Failed to cancel receipt debt");
    }

    return response.data;
  };

  const getStatistics = async (): Promise<
    { totalCount: number; totalOutstandingAmount: number }
  > => {
    const response: IHttpResponse = await request.get(
      `/${PREFIX_PATH}/statistics`,
    );

    if (!response.success) {
      throw new Error(
        response.message || "Failed to fetch receipt debt statistics",
      );
    }

    return response.data;
  };

  return {
    getList,
    getDetail,
    create,
    update,
    remove,
    updateInventoryForNewPeriod,
    payDebt,
    getPaymentTransactions,
    updateReceiptPeriod,
    cancelReceiptDebt,
    getStatistics,
  };
};

export default useReceiptDebt;
