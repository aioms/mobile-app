import { request } from "../../helpers/axios";

const useReceiptItem = () => {
  const getDetail = async (id: string) => {
    const response = await request.get(`/receipt-items/${id}`);
    return response.data;
  };

  const create = async (data: any) => {
    const response = await request.post(`/receipt-items`, data);
    return response.data;
  };

  const update = async (id: string, data: any) => {
    const response = await request.put(`/receipt-items/${id}`, data);
    return response.data;
  };

  return {
    getDetail,
    create,
    update,
  };
};

export default useReceiptItem;