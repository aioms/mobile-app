import { IHttpResponse } from "@/types";
import { PayDebtRequestDto } from "@/types/payment.type";
import { TransactionListResponse } from "@/types/transaction.type";
import { request } from "../../helpers/axios";

const PREFIX_PATH = "receipt-debt";

const useReceiptDebt = () => {
  const getList = async (
    filters?: Record<string, string>,
    page: number = 1,
    limit: number = 10
  ) => {
    const query = new URLSearchParams(filters);

    const response: IHttpResponse = await request.get(
      `/${PREFIX_PATH}?${query.toString()}&page=${page}&limit=${limit}`
    );
    return response
  };

  const getDetail = async (id: string) => {
    const response = await request.get(`/${PREFIX_PATH}/${id}`);
    return response.data;
  };

  const create = async (data: any) => {
    const response = await request.post(`/${PREFIX_PATH}`, data);
    return response.data;
  };

  const update = async (id: string, data: any) => {
    const response = await request.put(`/${PREFIX_PATH}/${id}`, data);
    return response.data;
  };

  const remove = async (id: string) => {
    const response = await request.delete(`/${PREFIX_PATH}/${id}`);
    return response.data;
  };

  const updateInventoryForNewPeriod = async (id: string, payload: any) => {
    const response: IHttpResponse = await request.patch(`/${PREFIX_PATH}/${id}/inventory/update`, payload);
    return response;
  };

  const payDebt = async (id: string, paymentData: PayDebtRequestDto) => {
    try {
      const response: IHttpResponse = await request.post(`/${PREFIX_PATH}/${id}/payment`, paymentData);
      return response;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Payment failed");
    }
  };

  const getPaymentTransactions = async (id: string): Promise<TransactionListResponse> => {
    try {
      const response: IHttpResponse = await request.get(`/${PREFIX_PATH}/${id}/payment`);
      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to fetch payment transactions");
    }
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
  };
};

export default useReceiptDebt;
