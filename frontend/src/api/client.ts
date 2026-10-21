import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Config from 'react-native-config';
import { storage } from '../utils/storage';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../store/auth.store';

// Config.API_BASE_URL is bundled from .env at NATIVE BUILD time — so .env edits don't take
// effect on device without a rebuild. In DEV we therefore hardcode the local backend so a
// Metro reload can switch it instantly. Release builds still use the baked prod URL.
//   Android → localhost, reached through `adb reverse tcp:3010 tcp:3010` (USB or emulator).
//             Machine-independent: no IP to keep in sync.
//   iOS     → the Mac's LAN IP, because `localhost` on a real iPhone means the phone itself.
//             UPDATE THIS when the Mac's Wi-Fi IP changes (`ipconfig getifaddr en0`).
const BASE_URL = __DEV__
  ? Platform.select({
      android: 'http://localhost:3010/api/v1',
      default: 'http://192.168.1.5:3010/api/v1',
    })
  : (Config.API_BASE_URL ?? 'https://api.getverdance.com/api/v1');

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
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function drainQueue(newToken: string) {
  refreshQueue.forEach(p => p.resolve(newToken));
  refreshQueue = [];
}

function rejectQueue(err: unknown) {
  refreshQueue.forEach(p => p.reject(err));
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
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
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

      original.headers.Authorization = `Bearer ${newAccessToken}`;
      drainQueue(newAccessToken);

      return apiClient(original);
    } catch {
      // Refresh failed — force logout by clearing tokens
      await storage.clearTokens();
      queryClient.clear();
      useAuthStore.getState().reset();
      rejectQueue(error);
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

export async function apiPost<T>(url: string, body?: object, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.post<{ data: T }>(url, body, config);
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
