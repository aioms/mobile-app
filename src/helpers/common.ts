import { Capacitor } from "@capacitor/core";

export const isWeb = () => {
  return Capacitor.getPlatform() === "web";
}

export const isNative = () => {
  return Capacitor.isNativePlatform();
}

export const parseSafe = (json: string) => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const stringifySafe = (data: any) => {
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

export const convertObjectToQueryString = (params: Record<string, any>) => {
  return Object.keys(params)
    .map((key) => key + "=" + params[key])
    .join("&");
};

export const isHasProperty = (obj: Record<string, unknown>) => {
  return Object.keys(obj).length;
}