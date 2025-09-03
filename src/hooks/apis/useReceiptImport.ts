import { request } from "../../helpers/axios";

const useReceiptImport = () => {
  const getList = async (
    filters?: Record<string, string>,
    page: number = 1,
    limit: number = 10
  ) => {
    const query = new URLSearchParams(filters);

    const response = await request.get(
      `/receipt-imports?${query.toString()}&page=${page}&limit=${limit}`
    );
    return response?.data || [];
  };

  const getDetail = async (id: string) => {
    const response = await request.get(`/receipt-imports/${id}`);
    return response.data;
  };

  const importQuick = async (data: any) => {
    const response = await request.post(`/receipt-imports/quick`, data);
    return response.data;
  };

  const create = async (data: any) => {
    const response = await request.post(`/receipt-imports`, data);
    return response.data;
  };

  const update = async (id: string, data: any) => {
    const response = await request.put(`/receipt-imports/${id}`, data);
    return response.data;
  };

  const remove = async (id: string) => {
    const response = await request.delete(`/receipt-imports/${id}`);
    return response.data;
  };

  const getTotalImportsByDateRange = async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params);
    const response = await request.get(
      `/receipt-imports/total?${query.toString()}`
    );
    return response.data;
  };

  const cancelReceiptImport = async (id: string) => {
    const response = await request.put(`/receipt-imports/${id}/cancel`);
    return response.data;
  };

  return {
    getList,
    getDetail,
    importQuick,
    create,
    update,
    remove,
    getTotalImportsByDateRange,
    cancelReceiptImport,
  };
};

export default useReceiptImport;