import { useEffect, useState } from "react";
import { Toast } from "@capacitor/toast";

import { request } from "../helpers/axios";

import { IHttpResponse, User } from "../types";
import { useStorage } from "./useStorage";

export const useAuth = () => {
  const { addItem, getItem, removeItem } = useStorage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    return false;
    // const payload = decodeJWT(token);
    // if (!payload || !payload.exp) return true;

    // const currentTime = Math.floor(Date.now() / 1000);
    // return payload.exp < currentTime;
  };

  // Check authentication on app startup
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setIsLoading(true);
        const token = await getItem("token");
        console.log({ token });

        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Token is valid, restore session
        const storedUser = await getItem("user");
        setIsAuthenticated(true);
        setUser(storedUser);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
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

      const { token, user: userData } = response.data;

      // Validate token before storing
      if (!token || isTokenExpired(token)) {
        return {
          statusCode: 401,
          message: "Invalid or expired token received",
          success: false,
          data: null,
        };
      }

      // Store token and user data
      await Promise.all([addItem("token", token), addItem("user", userData)]);

      setIsAuthenticated(true);
      setUser(userData);

      return response;
    } catch (error: any) {
      console.error("Login error:", JSON.stringify(error));
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

  // Get current token
  const getToken = async (): Promise<string | null> => {
    const token = await getItem("token");
    if (!token || isTokenExpired(token)) {
      return null;
    }
    return token;
  };

  // Check if current session is valid
  const isSessionValid = async (): Promise<boolean> => {
    const token = await getToken();
    return !!token && !isTokenExpired(token);
  };

  return {
    login,
    logout,
    isAuthenticated,
    user,
    isLoading,
    getToken,
    isSessionValid,
  };
};
