import { request } from "../../helpers/axios";
import { buildQueryString } from "../../helpers/common";

const useUser = () => {
  const getDetail = async (id: string) => {
    const response = await request.get(`/users/${id}`);
    return response.data;
  };

  const getList = async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10
  ) => {
    const queryString = buildQueryString(filters, page, limit);

    const response = await request.get(`/users?${queryString}`);
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