import { IHttpResponse } from "@/types/index.d";
import { request } from "../../helpers/axios";

const useOrder = () => {
  const getList = async (
    filters?: Record<string, string>,
    page: number = 1,
    limit: number = 10
  ) => {
    const query = new URLSearchParams(filters);

    const response: IHttpResponse = await request.get(
      `/orders?${query.toString()}&page=${page}&limit=${limit}`
    );

    return response;
  };

  const getDetail = async (id: string) => {
    const response = await request.get(`/orders/${id}`);
    return response.data;
  };

  const create = async (data: any) => {
    const response: IHttpResponse = await request.post(`/orders`, data);

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

  const getTotalOrderByDateRange = async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    const response = await request.get(
      `/orders/total?${query.toString()}`
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