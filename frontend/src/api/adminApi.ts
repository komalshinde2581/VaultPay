import api from './axiosClient';
import { Account, AdminStats, AdminUser, ApiResponse, AuditLog, FraudAlert, PagedResponse, TransactionReceipt } from '../types';

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await api.get<ApiResponse<AdminStats>>('/admin/stats');
    return res.data.data;
  },

  getUsers: async (query?: string, page = 0, size = 15): Promise<PagedResponse<AdminUser>> => {
    const res = await api.get<ApiResponse<PagedResponse<AdminUser>>>('/admin/users', {
      params: { query, page, size },
    });
    return res.data.data;
  },

  updateUserStatus: async (userId: number, status: string): Promise<AdminUser> => {
    const res = await api.patch<ApiResponse<AdminUser>>(`/admin/users/${userId}/status`, null, {
      params: { status },
    });
    return res.data.data;
  },

  getAccounts: async (query?: string, page = 0, size = 15): Promise<PagedResponse<Account>> => {
    const res = await api.get<ApiResponse<PagedResponse<Account>>>('/admin/accounts', {
      params: { query, page, size },
    });
    return res.data.data;
  },

  updateAccountStatus: async (accountId: number, status: string): Promise<Account> => {
    const res = await api.patch<ApiResponse<Account>>(`/admin/accounts/${accountId}/status`, null, {
      params: { status },
    });
    return res.data.data;
  },

  getTransactions: async (reference?: string, page = 0, size = 15): Promise<PagedResponse<TransactionReceipt>> => {
    const res = await api.get<ApiResponse<PagedResponse<TransactionReceipt>>>('/admin/transactions', {
      params: { reference, page, size },
    });
    return res.data.data;
  },

  getFraudAlerts: async (status?: string, page = 0, size = 15): Promise<PagedResponse<FraudAlert>> => {
    const res = await api.get<ApiResponse<PagedResponse<FraudAlert>>>('/admin/fraud-alerts', {
      params: { status, page, size },
    });
    return res.data.data;
  },

  reviewFraudAlert: async (alertId: number, data: { resolutionStatus: string; resolutionNotes?: string }): Promise<FraudAlert> => {
    const res = await api.patch<ApiResponse<FraudAlert>>(`/admin/fraud-alerts/${alertId}/review`, data);
    return res.data.data;
  },

  getAuditLogs: async (page = 0, size = 20): Promise<PagedResponse<AuditLog>> => {
    const res = await api.get<ApiResponse<PagedResponse<AuditLog>>>('/admin/audit-logs', {
      params: { page, size },
    });
    return res.data.data;
  },
};
