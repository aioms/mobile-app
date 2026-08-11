import { IHttpResponse } from "@/types/index.d";
import { request } from "../../helpers/axios";
import { buildQueryString } from "../../helpers/common";

const useOrder = () => {
  const getList = async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10
  ) => {
    const queryString = buildQueryString(filters, page, limit);

    const response: IHttpResponse = await request.get(
      `/orders?${queryString}`
    );

    return response;
  };

  const getDetail = async (id: string) => {
    const response = await request.get(`/orders/${id}`);
    return response.data;
  };

  const create = async (data: any, requestId?: string) => {
    const response: IHttpResponse = await request.post(`/orders`, data, {
      headers: requestId ? { "X-Request-ID": requestId } : undefined,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to create order");
    }

    return response.data;
  };

  const update = async (id: string, data: any) => {
    const response: IHttpResponse = await request.put(`/orders/${id}`, data);

    if (!response.success) {
      throw new Error(response.message || "Failed to update order");
    }
    
    return response.data;
  };

  const getTotalOrderByDateRange = async (params?: Record<string, any>) => {
    const queryString = buildQueryString(params);
    const response = await request.get(
      `/orders/total?${queryString}`
    );
    return response.data;
  };

  return {
    getList,
    getDetail,
    create,
    update,
    getTotalOrderByDateRange,
  };
};

export default useOrder;
