import { IProduct } from "@/types/product.type";
import { request } from "../../helpers/axios";

interface ProductFilters {
  keyword?: string;
  maxInventory?: number;
  categories?: string[];
  suppliers?: string[];
  status?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
}

interface HistoryFilters {
  type: string;
  productId: string;
}

const useProduct = () => {
  const getList = async (
    filters?: ProductFilters,
    page: number = 1,
    limit: number = 10
  ) => {
    const query = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;

        if (Array.isArray(value)) {
          value.forEach((item) => {
            query.append(`${key}`, item);
          });
        } else if (value !== undefined && value !== null && value !== "") {
          query.append(key, value.toString());
        }
      });
    }

    query.append("page", page.toString());
    query.append("limit", limit.toString());

    const response = await request.get(`/products?${query.toString()}`);
    return response.data;
  };

  const getDetail = async (id: string): Promise<IProduct> => {
    const response = await request.get(`/products/${id}`);
    return response.data;
  };

  const create = async (data: any) => {
    const response = await request.post(`/products`, data);
    return response.data;
  };

  const update = async (id: string, data: any) => {
    const response = await request.put(`/products/${id}`, data);
    return response.data;
  };

  const remove = async (id: string) => {
    const response = await request.delete(`/products/${id}`);
    return response.data;
  };

  const getTotalProductAndInventory = async () => {
    const response = await request.get(`/products/total`);
    return response.data;
  };

  const getCategories = async (
    filters?: Record<string, string>,
    page: number = 1,
    limit: number = 10
  ) => {
    const query = new URLSearchParams(filters);

    const response = await request.get(
      `/categories?${query.toString()}&page=${page}&limit=${limit}`
    );
    return response.data;
  };

  const getHistory = async (
    filters?: HistoryFilters,
    page: number = 1,
    limit: number = 10
  ) => {
    const query = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;

        if (Array.isArray(value)) {
          value.forEach((item) => {
            query.append(`${key}`, item);
          });
        } else if (value !== undefined && value !== null && value !== "") {
          query.append(key, value.toString());
        }
      });
    }

    query.append("page", page.toString());
    query.append("limit", limit.toString());

    const response = await request.get(`/products/history?${query.toString()}`);
    return response.data;
  };

  return {
    getList,
    getDetail,
    create,
    update,
    remove,
    getTotalProductAndInventory,
    getCategories,
    getHistory,
  };
};

export default useProduct;
