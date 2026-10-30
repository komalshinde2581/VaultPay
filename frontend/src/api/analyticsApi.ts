import api from './axiosClient';
import { ApiResponse, CategorySpending, DailySpending, FinancialSummary, MonthlyTrend } from '../types';

export const analyticsApi = {
  getSummary: async (): Promise<FinancialSummary> => {
    const res = await api.get<ApiResponse<FinancialSummary>>('/analytics/summary');
    return res.data.data;
  },

  getMonthlyTrends: async (): Promise<MonthlyTrend[]> => {
    const res = await api.get<ApiResponse<MonthlyTrend[]>>('/analytics/monthly');
    return res.data.data;
  },

  getCategories: async (): Promise<CategorySpending[]> => {
    const res = await api.get<ApiResponse<CategorySpending[]>>('/analytics/categories');
    return res.data.data;
  },

  getDailySpending: async (days = 14): Promise<DailySpending[]> => {
    const res = await api.get<ApiResponse<DailySpending[]>>('/analytics/daily', {
      params: { days },
    });
    return res.data.data;
  },
};
