import api from './axiosClient';
import { ApiResponse, ScheduledPayment } from '../types';

export const scheduledApi = {
  getScheduledPayments: async (): Promise<ScheduledPayment[]> => {
    const res = await api.get<ApiResponse<ScheduledPayment[]>>('/scheduled-payments');
    return res.data.data;
  },

  createScheduledPayment: async (data: {
    sourceAccountNumber: string;
    targetAccountNumber: string;
    amount: number;
    recurrenceType: string;
    executionDate: string;
    endDate?: string;
    description?: string;
  }): Promise<ScheduledPayment> => {
    const res = await api.post<ApiResponse<ScheduledPayment>>('/scheduled-payments', data);
    return res.data.data;
  },

  cancelScheduledPayment: async (id: number): Promise<void> => {
    await api.delete(`/scheduled-payments/${id}`);
  },

  triggerRun: async (): Promise<void> => {
    await api.post('/scheduled-payments/trigger-run');
  },
};
