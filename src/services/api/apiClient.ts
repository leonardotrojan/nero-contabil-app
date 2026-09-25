import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { BASE_URL } from "./endpoints";
import { authStorage } from "./authStorage";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Inject auth token on every request
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") {
      return Promise.reject(new ApiError("network", "Sem conexão com o servidor"));
    }

    if (!error.response) {
      return Promise.reject(new ApiError("network", "Servidor indisponível"));
    }

    const { status, data } = error.response;

    if (status === 401) {
      return Promise.reject(new ApiError("unauthorized", "Sessão expirada"));
    }

    if (status === 404) {
      return Promise.reject(new ApiError("not_found", "Recurso não encontrado"));
    }

    if (status >= 500) {
      return Promise.reject(new ApiError("server", "Erro interno do servidor"));
    }

    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : "Erro desconhecido";

    return Promise.reject(new ApiError("request", message, status));
  }
);

export type ApiErrorCode = "network" | "unauthorized" | "not_found" | "server" | "request";

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNetwork() {
    return this.code === "network";
  }

  get isUnauthorized() {
    return this.code === "unauthorized";
  }
}
