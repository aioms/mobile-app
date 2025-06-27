import { Capacitor } from "@capacitor/core";
import { Environment } from "@/common/enums";

export const isWeb = () => {
  return Capacitor.getPlatform() === "web";
};

export const isNative = () => {
  return Capacitor.isNativePlatform();
};

export const getEnvironment = (): Environment => {
  const env = process.env.REACT_APP_ENV;

  switch (env) {
    case "production":
      return Environment.PRODUCTION;
    case "staging":
      return Environment.STAGING;
    case "development":
      return Environment.DEVELOPMENT;
    default:
      throw new Error("Invalid environment");
  }
};

export const parseSafe = (json: string) => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const stringifySafe = (data: any) => {
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
};

export const convertObjectToQueryString = (params: Record<string, any>) => {
  return Object.keys(params)
    .map((key) => key + "=" + params[key])
    .join("&");
};

export const isHasProperty = (obj: Record<string, unknown>) => {
  return Object.keys(obj).length;
};

export const capitalizeFirstLetter = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
