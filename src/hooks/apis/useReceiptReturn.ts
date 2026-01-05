import { IHttpResponse } from "@/types";
import { CreateReceiptReturnRequestDto } from "@/types/receipt-return.type";
import { request } from "../../helpers/axios";

const useReceiptReturn = () => {
  const getList = async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10,
  ) => {
    const query = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;

        if (Array.isArray(value)) {
          value.forEach((item) => {
            query.append(key, item);
          });
        } else if (value !== undefined && value !== null && value !== "") {
          query.append(key, value.toString());
        }
      });
    }

    const response = await request.get(
      `/receipt-return?${query.toString()}&page=${page}&limit=${limit}`,
    );
    return response?.data || [];
  };

  const getDetail = async (id: string) => {
    const response = await request.get(`/receipt-return/${id}`);
    return response.data;
  };

  const create = async (data: CreateReceiptReturnRequestDto) => {
    const response: IHttpResponse = await request.post(`/receipt-return`, data);

    if (!response.success) {
      throw new Error(response?.message || "Failed to create receipt return");
    }

    return response.data;
  };

  const update = async (
    id: string,
    data: Partial<CreateReceiptReturnRequestDto>,
  ) => {
    const response: IHttpResponse = await request.put(
      `/receipt-return/${id}`,
      data,
    );

    if (!response.success) {
      throw new Error(response?.message || "Failed to update receipt return");
    }

    return response.data;
  };

  const remove = async (id: string) => {
    const response: IHttpResponse = await request.delete(
      `/receipt-return/${id}`,
    );

    if (!response.success) {
      throw new Error(response?.message || "Failed to delete receipt return");
    }

    return response.data;
  };

  const cancel = async (id: string) => {
    const response: IHttpResponse = await request.put(
      `/receipt-return/${id}/cancel`,
    );

    if (!response.success) {
      throw new Error(response?.message || "Failed to cancel receipt return");
    }

    return response.data;
  };

  return {
    getList,
    getDetail,
    create,
    update,
    remove,
    cancel,
  };
};

export default useReceiptReturn;
