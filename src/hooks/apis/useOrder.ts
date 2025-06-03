import { IHttpResponse } from "@/types";
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
    const response = await request.post(`/orders`, data);
    return response.data;
  };

  const update = async (id: string, data: any) => {
    const response = await request.put(`/orders/${id}`, data);
    return response.data;
  };

  return {
    getList,
    getDetail,
    create,
    update,
  };
};

export default useOrder;