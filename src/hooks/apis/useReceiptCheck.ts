import { IHttpResponse } from "@/types";
import { request } from "../../helpers/axios";

const useReceiptCheck = () => {
  const getList = async (
    filters?: Record<string, string>,
    page: number = 1,
    limit: number = 10
  ) => {
    const query = new URLSearchParams(filters);

    const response: IHttpResponse = await request.get(
      `/receipt-check?${query.toString()}&page=${page}&limit=${limit}`
    );
    return response;
  };

  const getDetail = async (id: string) => {
    const response = await request.get(`/receipt-check/${id}`);
    return response.data;
  };

  const create = async (data: any) => {
    const response: IHttpResponse = await request.post(`/receipt-check`, data);

    if (!response.success) {
      throw new Error(response.message || "Failed to create receipt check");
    }

    return response.data;
  };

  const update = async (id: string, data: any) => {
    const response: IHttpResponse = await request.put(`/receipt-check/${id}`, data);
    
    if (!response.success) {
      throw new Error(response.message || "Failed to update receipt check");
    }

    return response.data;
  };

  const remove = async (id: string) => {
    const response = await request.delete(`/receipt-check/${id}`);
    return response.data;
  };

  const incrementActualInventory = async (id: string, productCode: string) => {
    const response: IHttpResponse = await request.patch(`/receipt-check/${id}/receipt-items/${productCode}`);
    
    if (response.statusCode !== 200 || !response.success) {
      throw new Error(response.message || "Failed to increment actual inventory");
    }
    
    return response.data;
  };

  const updateBalanceInventory = async (id: string, items: any[]) => {
    const response: IHttpResponse = await request.patch(`/receipt-check/${id}/balance`, {
      items,
    });
    
    if (response.statusCode !== 200 || !response.success) {
      throw new Error(response.message || "Failed to update balance inventory");
    }
    
    return response.data;
  };

  return {
    getList,
    getDetail,
    create,
    update,
    remove,
    incrementActualInventory,
    updateBalanceInventory,
  };
};

export default useReceiptCheck;