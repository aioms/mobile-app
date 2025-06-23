import { IHttpResponse } from "@/types";
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

  return {
    getList,
    getDetail,
    create,
    update,
    remove,
  };
};

export default useReceiptDebt;
