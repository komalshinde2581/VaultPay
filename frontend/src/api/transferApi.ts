import api, { generateIdempotencyKey } from './axiosClient';
import { ApiResponse, PagedResponse, TransactionReceipt, TransferRequest, TransferResponse } from '../types';

export const transferApi = {
  executeTransfer: async (data: TransferRequest, idempotencyKey?: string): Promise<TransferResponse> => {
    const key = idempotencyKey || generateIdempotencyKey();
    const res = await api.post<ApiResponse<TransferResponse>>('/transfers', data, {
      headers: {
        'Idempotency-Key': key,
      },
    });
    return res.data.data;
  },

  getTransactions: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<TransactionReceipt>> => {
    const res = await api.get<ApiResponse<PagedResponse<TransactionReceipt>>>('/transfers', { params });
    return res.data.data;
  },

  getByReference: async (reference: string): Promise<TransactionReceipt> => {
    const res = await api.get<ApiResponse<TransactionReceipt>>(`/transfers/reference/${reference}`);
    return res.data.data;
  },
};
