import { IHttpResponse } from "@/types";
import { request } from "../../helpers/axios";
import { buildQueryString } from "../../helpers/common";
import { ISupplierListItem, ISupplierDetail } from "@/types/supplier";

const useSupplier = () => {
  const getList = async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10,
  ) => {
    const queryString = buildQueryString(filters, page, limit);

    const response: IHttpResponse<ISupplierListItem[]> = await request.get(
      `/suppliers?${queryString}`,
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
