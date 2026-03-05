import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export interface VerifyResponse {
  success: boolean;
  gasEstimate?: {
    gasBudget: number;
    gasPrice: number;
    computationCost: number;
    storageCost: number;
    storageRebate: number;
  };
  error?: string;
}

export interface SponsorResponse {
  success: boolean;
  sponsoredTxBlock?: string;
  txDigest?: string;
  sponsorSignature?: string;
  expireAtTime?: number;
  expireAfterEpoch?: number;
  callbackUrl?: string;
  error?: string;
}

export const sponsorApi = {
  verify: async (txBlock: string, walletAddress: string): Promise<VerifyResponse> => {
    const response = await apiClient.post('/api/sponsor-verify', {
      txBlock,
      walletAddress,
    });
    return response.data;
  },

  sponsor: async (
    txBlock: string,
    walletAddress: string,
    callbackUrl?: string
  ): Promise<SponsorResponse> => {
    const response = await apiClient.post('/api/sponsor-public', {
      txBlock,
      walletAddress,
      callbackUrl,
    });
    return response.data;
  },
};
