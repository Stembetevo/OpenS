import { create } from 'zustand';

export interface Transaction {
  txBlock: string;
  walletAddress: string;
  callbackUrl?: string;
}

export interface SponsorStore {
  transaction: Transaction | null;
  setTransaction: (tx: Transaction | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useSponsorStore = create<SponsorStore>((set) => ({
  transaction: null,
  setTransaction: (transaction) => set({ transaction }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),
}));
