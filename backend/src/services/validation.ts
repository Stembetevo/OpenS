import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Constants
const MAX_GAS_PER_TRANSACTION = 0.05; // SUI
const MAX_DAILY_TX_PER_WALLET = 10;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class ValidationService {
  /**
   * Check if wallet has exceeded daily transaction limit
   */
  async checkDailyTxLimit(walletAddress: string, dAppPartnerId: string): Promise<ValidationResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyUsage = await prisma.walletDailyUsage.findUnique({
      where: {
        walletAddress_date_dAppPartnerId: {
          walletAddress,
          date: today,
          dAppPartnerId,
        },
      },
    });

    const currentTxCount = dailyUsage?.txCount || 0;

    if (currentTxCount >= MAX_DAILY_TX_PER_WALLET) {
      return {
        valid: false,
        error: `Daily transaction limit exceeded. Max ${MAX_DAILY_TX_PER_WALLET} transactions per day.`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if package ID is in dApp's allowlist
   */
  async checkPackageAllowlist(packageId: string, dAppPartnerId: string): Promise<ValidationResult> {
    const allowedPackage = await prisma.allowedPackage.findFirst({
      where: {
        packageId,
        dAppPartnerId,
      },
    });

    if (!allowedPackage) {
      return {
        valid: false,
        error: `Package ID ${packageId} is not in the allowed list for this dApp.`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if gas estimate exceeds max allowed
   */
  checkGasLimit(gasEstimate: number): ValidationResult {
    const gasInSui = gasEstimate / 1_000_000_000; // Convert from MIST to SUI

    if (gasInSui > MAX_GAS_PER_TRANSACTION) {
      return {
        valid: false,
        error: `Gas estimate ${gasInSui} SUI exceeds maximum allowed ${MAX_GAS_PER_TRANSACTION} SUI.`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate simulation result
   */
  checkSimulationSuccess(success: boolean, error?: string): ValidationResult {
    if (!success) {
      return {
        valid: false,
        error: error || 'Transaction simulation failed.',
      };
    }

    return { valid: true };
  }

  /**
   * Increment daily transaction count for wallet
   */
  async incrementDailyTxCount(walletAddress: string, dAppPartnerId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.walletDailyUsage.upsert({
      where: {
        walletAddress_date_dAppPartnerId: {
          walletAddress,
          date: today,
          dAppPartnerId,
        },
      },
      update: {
        txCount: { increment: 1 },
      },
      create: {
        walletAddress,
        date: today,
        txCount: 1,
        dAppPartnerId,
      },
    });
  }
}

export const validationService = new ValidationService();

