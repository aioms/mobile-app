import { request } from "../../helpers/axios";

const useUser = () => {
  const getDetail = async (id: string) => {
    const response = await request.get(`/users/${id}`);
    return response.data;
  };

  const getList = async (
    filters?: Record<string, string>,
    page: number = 1,
    limit: number = 10
  ) => {
    const query = new URLSearchParams(filters);

    const response = await request.get(
      `/users?${query.toString()}&page=${page}&limit=${limit}`
    );
    return response.data;
  };

  const create = async (data: any) => {
    const response = await request.post(`/users`, data);
    return response.data;
  };

  const update = async (id: string, data: any) => {
    const response = await request.put(`/users/${id}`, data);
    return response.data;
  };

  const remove = async (id: string) => {
    const response = await request.delete(`/users/${id}`);
    return response.data;
  };

  return {
    getDetail,
    getList,
    create,
    update,
    remove,
  };
};

export default useUser;