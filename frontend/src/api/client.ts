import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Config from 'react-native-config';
import { storage } from '../utils/storage';

const BASE_URL = Config.API_BASE_URL ?? 'http://10.0.2.2:3010/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach access token ───────────────────────────────
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — silent token refresh on 401 ──────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function drainQueue(newToken: string) {
  refreshQueue.forEach(cb => cb(newToken));
  refreshQueue = [];
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request until new token arrives
    if (isRefreshing) {
      return new Promise(resolve => {
        refreshQueue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const newAccessToken: string = data.data.accessToken;

      await storage.setAccessToken(newAccessToken);

      // Update store without importing it (avoids circular deps)
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      drainQueue(newAccessToken);

      return apiClient(original);
    } catch {
      // Refresh failed — force logout by clearing tokens
      await storage.clearTokens();
      // Signal the auth store to reset (store listens to this event)
      refreshQueue = [];
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

/** Typed wrapper — all API responses follow { success, data, message } shape */
export async function apiGet<T>(url: string, params?: object): Promise<T> {
  const res = await apiClient.get<{ data: T }>(url, { params });
  return res.data.data;
}

export async function apiPost<T>(url: string, body?: object): Promise<T> {
  const res = await apiClient.post<{ data: T }>(url, body);
  return res.data.data;
}

export async function apiPut<T>(url: string, body?: object): Promise<T> {
  const res = await apiClient.put<{ data: T }>(url, body);
  return res.data.data;
}

export async function apiPatch<T>(url: string, body?: object): Promise<T> {
  const res = await apiClient.patch<{ data: T }>(url, body);
  return res.data.data;
}

export async function apiDelete<T = void>(url: string): Promise<T> {
  const res = await apiClient.delete<{ data: T }>(url);
  return res.data.data;
}

/** Extract a friendly error message from an Axios error */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg[0];
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}
