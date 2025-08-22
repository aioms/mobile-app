import { Capacitor } from "@capacitor/core";
import { Environment } from "@/common/enums";

export const env = import.meta.env.VITE_ENV;
export const envConfig = import.meta.env;

export const isWeb = () => {
  return Capacitor.getPlatform() === "web";
};

export const isNative = () => {
  return Capacitor.isNativePlatform();
};

export const getEnvironment = (): Environment => {
  console.log("ENVIRONMENT", env);
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

export const createDebounce = <T extends any[]>(
  func: (...args: T) => void,
  delay: number
) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};


export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}