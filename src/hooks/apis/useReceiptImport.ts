import { useCallback } from 'react';
import { IHttpResponse } from "@/types";
import { request } from "../../helpers/axios";

const useReceiptImport = () => {
  const getList = useCallback(async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10
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
      `/receipt-imports?${query.toString()}&page=${page}&limit=${limit}`
    );
    return response;
  }, []);

  const getDetail = useCallback(async (id: string) => {
    const response = await request.get(`/receipt-imports/${id}`);
    return response.data;
  }, []);

  const importQuick = useCallback(async (data: any) => {
    const response: IHttpResponse = await request.post(`/receipt-imports/quick`, data);

    if (!response.success) {
      throw new Error(response?.message || "Import failed");
    }

    return response.data;
  }, []);

  const createWithProductCode = useCallback(async (data: any, requestId?: string) => {
    const response: IHttpResponse = await request.post(`/receipt-imports/product-code`, data, {
      headers: requestId ? { "X-Request-ID": requestId } : undefined,
    });

    if (!response.success) {
      throw new Error(response?.message || "Import failed");
    }

    return response.data;
  }, []);

  const create = useCallback(async (data: any, requestId?: string) => {
    const response = await request.post(`/receipt-imports`, data, {
      headers: requestId ? { "X-Request-ID": requestId } : undefined,
    });
    return response.data;
  }, []);

  const update = useCallback(async (id: string, data: any) => {
    const response = await request.put(`/receipt-imports/${id}`, data);
    return response.data;
  }, []);

  const remove = useCallback(async (id: string) => {
    const response = await request.delete(`/receipt-imports/${id}`);
    return response.data;
  }, []);

  const deleteItem = useCallback(async (receiptId: string, itemId: string) => {
    const response: IHttpResponse = await request.delete(
      `/receipt-imports/${receiptId}/items/${itemId}`
    );

    if (!response?.success) {
      throw new Error(response?.message || "Xóa sản phẩm khỏi phiếu nhập thất bại");
    }

    return response.data;
  }, []);

  const getTotalImportsByDateRange = useCallback(async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    const response = await request.get(
      `/receipt-imports/total?${query.toString()}`
    );
    return response.data;
  }, []);

  const cancelReceiptImport = useCallback(async (id: string) => {
    const response = await request.put(`/receipt-imports/${id}/cancel`);
    return response.data;
  }, []);

  return {
    getList,
    getDetail,
    importQuick,
    create,
    update,
    remove,
    deleteItem,
    createWithProductCode,
    getTotalImportsByDateRange,
    cancelReceiptImport,
  };
};

export default useReceiptImport;
