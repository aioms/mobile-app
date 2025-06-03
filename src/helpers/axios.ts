import axios from "axios";
import type { IExtraConfig, IHttpRequestConfig } from "../types";
import { initStorage } from "../hooks";

const {
  VITE_ENV,
  VITE_API_URL,
  VITE_SERVER_URL,
  VITE_API_VERSION,
  VITE_API_URL_DEV,
  VITE_SERVER_URL_DEV,
} = import.meta.env;

const serverUrl: Record<string, string> = {
  development: VITE_SERVER_URL_DEV!,
  production: VITE_SERVER_URL!,
};
const apiUrl: Record<string, string> = {
  development: VITE_API_URL_DEV!,
  production: VITE_API_URL!,
};

export const defaultConfig: IHttpRequestConfig = {
  server: {
    api: apiUrl[VITE_ENV!],
    baseUrl: serverUrl[VITE_ENV!],
    version: VITE_API_VERSION!,
    headers: {
      "Content-Type": "application/json",
    },
  },
};

export class HttpRequest {
  private config: Partial<IExtraConfig> = {};

  public addVersion(v: string | boolean) {
    if (typeof v === "boolean" && v) {
      this.config.apiVersion = defaultConfig.server.version;
    } else if (typeof v === "string") {
      this.config.apiVersion = v;
    }

    return this.init();
  }

  public addHeaders(headers: Record<string, any>) {
    this.config.headers = headers;
  }

  public init() {
    const { apiVersion, headers } = this.config;
    const { api, headers: _headers } = defaultConfig.server;

    const options: Record<string, any> = {
      baseURL: api,
      headers: _headers,
      withCredentials: false,
      timeout: 20_000,
    };

    if (apiVersion) {
      options.baseURL = `${api}/${apiVersion}`;
    }

    if (headers && Object.keys(headers).length) {
      Object.keys(headers).forEach((key) => {
        options.headers[key] = headers[key];
      });
    }

    const instance = axios.create(options);

    instance.interceptors.request.use(
      async function (config) {
        const storage = await initStorage();
        const token = await storage.get("token"); // Retrieve the token from localStorage

        if (token) {
          config.headers.Authorization = `Bearer ${token}`; // Attach the token to the Authorization header
        }
        console.log(JSON.stringify({
          'interceptors.request.use': config
        }))
        return config;
      },
      function (error) {
        console.error(JSON.stringify({
          'interceptors.request.error': error
        }))
        // Do something with request error
        return error;
      },
    );

    instance.interceptors.response.use(
      function (response) {
        console.log(JSON.stringify({
          'interceptors.response.use': response
        }));
        if (response.status === 204) {
          return {
            statusCode: response.status,
            statusText: response.statusText,
          };
        }

        return response.data;
      },
      async function (error) {
        const resp = error.response;
        const data = resp?.data;

        console.error(JSON.stringify({
          'interceptors.response.error': error
        }))

        if (resp.status === 401 || resp.statusText === "Unauthorized") {
          const storage = await initStorage();
          await Promise.allSettled([
            storage.remove("token"),
            storage.remove("user"),
          ])
          window.location.replace("/login");
        }

        return data;
      },
    );

    return instance;
  }
}

const initHttpRequest = Object.freeze(new HttpRequest());

export const request = initHttpRequest.addVersion(true);
export default initHttpRequest;
