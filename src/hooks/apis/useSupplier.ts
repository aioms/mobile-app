import { IHttpResponse } from "@/types";
import { request } from "../../helpers/axios";
import { ISupplier } from "@/types/supplier";

const useSupplier = () => {
  const getList = async (
    filters?: Record<string, string>,
    page: number = 1,
    limit: number = 10,
  ) => {
    const query = new URLSearchParams(filters);

    const response: IHttpResponse<ISupplier[]> = await request.get(
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

  return {
    getList,
    create,
  };
};

export default useSupplier;
