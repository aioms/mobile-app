import { IHttpResponse } from "@/types";
import { PayDebtRequestDto } from "@/types/payment.type";
import { TransactionListResponse } from "@/types/transaction.type";
import { CancelReceiptDebtRequestDto } from "@/types/receipt-debt.type";
import { request } from "../../helpers/axios";

const PREFIX_PATH = "receipt-debt";

const useReceiptDebt = () => {
  const getList = async (
    filters?: Record<string, string>,
    page: number = 1,
    limit: number = 10,
  ) => {
    const query = new URLSearchParams(filters);

    const response: IHttpResponse = await request.get(
      `/${PREFIX_PATH}?${query.toString()}&page=${page}&limit=${limit}`,
    );
    return response;
  };

  const getDetail = async (id: string) => {
    const response = await request.get(`/${PREFIX_PATH}/${id}`);
    return response.data;
  };

  const create = async (data: any) => {
    const response: IHttpResponse = await request.post(`/${PREFIX_PATH}`, data);

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

  const updateInventoryForNewPeriod = async (id: string, payload: any) => {
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

  const updateReceiptItem = async (payload: {
    receiptItemId: string;
    quantity: number;
    costPrice: number;
  }) => {
    try {
      const response: IHttpResponse = await request.patch(
        `/${PREFIX_PATH}/item/update`,
        payload,
      );

      // Check if the API response indicates an error
      if (response && typeof response === "object" && "success" in response) {
        if (!response.success) {
          // Handle API error responses with specific error messages
          const errorMessage = response.message ||
            "Failed to update receipt item";
          throw new Error(errorMessage);
        }
      }

      return response.data || response;
    } catch (error) {
      // Handle both API errors and network errors
      if (error instanceof Error) {
        throw error; // Re-throw if it's already an Error (including our custom API errors)
      }

      // Handle unexpected error formats
      if (error && typeof error === "object" && "message" in error) {
        throw new Error(error.message as string);
      }

      throw new Error("Failed to update receipt item");
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
    updateReceiptItem,
    cancelReceiptDebt,
    getStatistics,
  };
};

export default useReceiptDebt;
