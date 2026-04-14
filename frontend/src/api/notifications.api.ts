import { apiGet, apiPut, apiDelete } from './client';
import type { NotificationsResponse } from '../types/notification.types';

export const notificationsApi = {
  list: (page = 1) =>
    apiGet<NotificationsResponse>('/notifications', { page }),

  markAsRead: (id: string) =>
    apiPut<{ message: string }>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiPut<{ message: string }>('/notifications/read-all'),

  delete: (id: string) =>
    apiDelete<{ message: string }>(`/notifications/${id}`),
};
