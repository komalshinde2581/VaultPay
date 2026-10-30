import api from './axiosClient';
import { Account, ApiResponse } from '../types';

export const accountApi = {
  getMyAccounts: async (): Promise<Account[]> => {
    const res = await api.get<ApiResponse<Account[]>>('/accounts');
    return res.data.data;
  },

  getAccountById: async (id: number): Promise<Account> => {
    const res = await api.get<ApiResponse<Account>>(`/accounts/${id}`);
    return res.data.data;
  },

  createAccount: async (data: { accountType: string; currency?: string; initialDeposit?: number }): Promise<Account> => {
    const res = await api.post<ApiResponse<Account>>('/accounts', data);
    return res.data.data;
  },

  freezeAccount: async (id: number, reason?: string): Promise<Account> => {
    const res = await api.patch<ApiResponse<Account>>(`/accounts/${id}/freeze`, null, {
      params: { reason },
    });
    return res.data.data;
  },

  unfreezeAccount: async (id: number, reason?: string): Promise<Account> => {
    const res = await api.patch<ApiResponse<Account>>(`/accounts/${id}/unfreeze`, null, {
      params: { reason },
    });
    return res.data.data;
  },
};
