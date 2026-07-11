import { useCallback } from "react";
import { request } from "../../helpers/axios";
import { IHttpResponse } from "@/types";

const useReceiptPayment = () => {
  const getList = useCallback(async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10
  ): Promise<IHttpResponse> => {
    const query = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;

        if (Array.isArray(value)) {
          value.forEach((item) => {
            query.append(key, item);
          });
        } else {
          query.append(key, value.toString());
        }
      });
    }

    const response: IHttpResponse = await request.get(
      `/receipt-payments?${query.toString()}&page=${page}&limit=${limit}`
    );
    return response;
  }, []);

  const getDetail = useCallback(async (id: string) => {
    const response = await request.get(`/receipt-payments/${id}`);
    return response.data;
  }, []);

  const create = useCallback(async (data: any) => {
    const response = await request.post(`/receipt-payments`, data);
    return response.data;
  }, []);

  const update = useCallback(async (id: string, data: any) => {
    const response = await request.put(`/receipt-payments/${id}`, data);
    return response.data;
  }, []);

  const remove = useCallback(async (id: string) => {
    const response = await request.delete(`/receipt-payments/${id}`);
    return response.data;
  }, []);

  const getSummary = useCallback(async (filters?: Record<string, any>) => {
    const query = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        query.append(key, value.toString());
      });
    }

    const response = await request.get(`/receipt-payments/summary?${query.toString()}`);
    return response.data;
  }, []);

  const getUnpaidReceiptImports = useCallback(async (supplierId: string): Promise<IHttpResponse> => {
    const response: IHttpResponse = await request.get(`/receipt-imports/unpaid?supplierId=${supplierId}`);
    return response;
  }, []);

  return {
    getList,
    getDetail,
    create,
    update,
    remove,
    getSummary,
    getUnpaidReceiptImports,
  };
};

export default useReceiptPayment;
