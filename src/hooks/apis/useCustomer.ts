import {
  ICustomer,
  ICustomerFilters,
} from "@/pages/Extended/CustomerList/types";
import { request } from "../../helpers/axios";
import { buildQueryString } from "../../helpers/common";
import { IHttpResponse } from "@/types";

const useCustomer = () => {
  const getList = async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10,
  ) => {
    const queryString = buildQueryString(filters, page, limit);

    const response = await request.get(`/customers?${queryString}`);
    return response.data;
  };

  const getListV2 = async (
    filters?: ICustomerFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<IHttpResponse<ICustomer[]>> => {
    const queryString = buildQueryString(filters, page, limit);

    const response: IHttpResponse = await request.get(
      `/customers/v2?${queryString}`,
    );
    return response;
  };

  const getDetail = async (id: string) => {
    const response = await request.get(`/customers/${id}`);
    return response.data;
  };

  const create = async (data: any) => {
    const response = await request.post(`/customers`, data);
    return response.data;
  };

  const update = async (id: string, data: any) => {
    const response = await request.put(`/customers/${id}`, data);
    return response.data;
  };

  const remove = async (id: string) => {
    const response = await request.delete(`/customers/${id}`);
    return response.data;
  };

  return {
    getList,
    getListV2,
    getDetail,
    create,
    update,
    remove,
  };
};

export default useCustomer;
