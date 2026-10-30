import api from './axiosClient';
import { ApiResponse, AuthResponse } from '../types';

export const authApi = {
  login: async (usernameOrEmail: string, password: string):Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', { usernameOrEmail, password });
    return response.data;
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('vaultpay_access_token');
      localStorage.removeItem('vaultpay_refresh_token');
      localStorage.removeItem('vaultpay_user');
    }
  },
};
