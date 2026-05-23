import { api } from '@/modules/shared/services/api';

export interface Notification {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export const notificationApi = {
  list: (unreadOnly = false) =>
    api.get<Notification[]>(`/notifications${unreadOnly ? '?unread=true' : ''}`),
  unreadCount: () => api.get<number>('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`, {}),
  markAllAsRead: () => api.patch('/notifications/read-all', {}),
};
