import { IHttpResponse } from "@/types";
import { request } from "../../helpers/axios";
import { ISupplierListItem, ISupplierDetail } from "@/types/supplier";

const useSupplier = () => {
  const getList = async (
    filters?: Record<string, string>,
    page: number = 1,
    limit: number = 10,
  ) => {
    const query = new URLSearchParams(filters);

    const response: IHttpResponse<ISupplierListItem[]> = await request.get(
      `/suppliers?${query.toString()}&page=${page}&limit=${limit}`,
    );
    return response;
  };

  const create = async (data: {
    name: string;
    phone: string;
    note: string;
  }) => {
    const response = await request.post("/suppliers", data);
    return response;
  };

  const getDetail = async (id: string) => {
    const response: IHttpResponse<ISupplierDetail> = await request.get(`/suppliers/${id}`);
    return response;
  };

  return {
    getList,
    getDetail,
    create,
  };
};

export default useSupplier;
