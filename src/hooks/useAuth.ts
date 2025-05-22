import { useEffect, useState } from "react";
import { Toast } from "@capacitor/toast";

import { parseSafe, stringifySafe } from "../helpers/common";
import { request } from "../helpers/axios";

import { IHttpResponse, User } from "../types";
import { useStorage } from "./useStorage";

export const useAuth = () => {
  const storage = useStorage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!storage) return;

      const token = await storage.get("token");
      setIsAuthenticated(!!token);

      if (token) {
        const user = parseSafe(await storage.get("user"));
        setUser(user);
      }
    };

    checkAuthentication();
  }, [storage]);

  const login = async (username: string, password: string) => {
    try {
      const response: IHttpResponse = await request.post(`/auth/login`, {
        username,
        password,
      });

      if (response.statusCode !== 200) {
        return response;
      }

      if (storage) {
        await Promise.all([
          storage.set("token", response.data?.token),
          storage.set("user", stringifySafe(response.data?.user)),
        ]);
      }

      setIsAuthenticated(true);
      setUser(response.data?.user);

      return response;
    } catch (error: any) {
      return error;
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);

    try {
      await request.post(`/auth/logout`);

      if (storage) {
        await Promise.all([storage.remove("token"), storage.remove("user")]);
      }
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
