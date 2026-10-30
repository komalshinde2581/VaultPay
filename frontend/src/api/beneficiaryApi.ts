import api from './axiosClient';
import { ApiResponse, Beneficiary } from '../types';

export const beneficiaryApi = {
  getMyBeneficiaries: async (): Promise<Beneficiary[]> => {
    const res = await api.get<ApiResponse<Beneficiary[]>>('/beneficiaries');
    return res.data.data;
  },

  addBeneficiary: async (data: {
    targetAccountNumber: string;
    beneficiaryName: string;
    nickname?: string;
    bankName?: string;
    transferLimit?: number;
  }): Promise<Beneficiary> => {
    const res = await api.post<ApiResponse<Beneficiary>>('/beneficiaries', data);
    return res.data.data;
  },

  deleteBeneficiary: async (id: number): Promise<void> => {
    await api.delete(`/beneficiaries/${id}`);
  },
};
