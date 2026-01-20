import { request } from "../../helpers/axios";

const useSupplier = () => {
  const getList = async (
    filters?: Record<string, string>,
    page: number = 1,
    limit: number = 10,
  ) => {
    const query = new URLSearchParams(filters);

    const response = await request.get(
      `/suppliers?${query.toString()}&page=${page}&limit=${limit}`,
    );
    return response.data;
  };

  const create = async (data: {
    name: string;
    phone: string;
    note: string;
  }) => {
    const response = await request.post("/suppliers", data);
    return response.data;
  };

  return {
    getList,
    create,
  };
};

export default useSupplier;
