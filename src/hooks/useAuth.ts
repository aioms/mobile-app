import { useEffect, useState } from "react";
import { Toast } from "@capacitor/toast";

import { request } from "../helpers/axios";

import { IHttpResponse, User } from "../types";
import { useStorage } from "./useStorage";

export const useAuth = () => {
  const { addItem, getItem, removeItem } = useStorage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = await getItem("token");
      setIsAuthenticated(!!token);

      if (token) {
        const user = await getItem("user");
        setUser(user);
      }
    };

    checkAuthentication();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response: IHttpResponse = await request.post(`/auth/login`, {
        username,
        password,
      });

      if (response.statusCode !== 200) {
        return response;
      }

      await Promise.all([
        addItem("token", response.data?.token),
        addItem("user", response.data?.user),
      ]);

      setIsAuthenticated(true);
      setUser(response.data?.user);

      return response;
    } catch (error: any) {
      console.error(JSON.stringify(error));
      return error;
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);

    try {
      await request.post(`/auth/logout`);
      await Promise.all([removeItem("token"), removeItem("user")]);
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "center",
      });
    }
  };

  return { login, logout, isAuthenticated, user };
};
