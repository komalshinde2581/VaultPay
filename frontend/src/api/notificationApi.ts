import api from './axiosClient';
import { ApiResponse, NotificationItem, PagedResponse } from '../types';

export const notificationApi = {
  getNotifications: async (page = 0, size = 15): Promise<PagedResponse<NotificationItem>> => {
    const res = await api.get<ApiResponse<PagedResponse<NotificationItem>>>('/notifications', {
      params: { page, size },
    });
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<ApiResponse<number>>('/notifications/unread-count');
    return res.data.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/mark-all-read');
  },
};
