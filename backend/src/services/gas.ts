export interface GasEstimate {
  gasBudget: number; // in MIST
  gasPrice: number; // in MIST
  computationCost: number;
  storageCost: number;
  storageRebate: number;
}

/**
 * Gas estimation service for Sui transactions
 */
export class GasService {
  private readonly GAS_BUDGET_MULTIPLIER = 1.2; // 20% buffer
  private readonly DEFAULT_GAS_PRICE = 1000; // MIST
  private readonly MIN_GAS_BUDGET = 1000; // Minimum gas budget in MIST

  /**
   * Estimate gas for a transaction block
   */
  async estimateGas(txBlockBytes: string): Promise<GasEstimate> {
    // Calculate transaction size
    const txSize = txBlockBytes.length / 2; // Hex string to bytes

    // Estimate computation cost based on transaction size
    const computationCost = this.estimateComputationCost(txSize);

    // Storage cost estimation (approximate)
    const storageCost = this.estimateStorageCost(txSize);

    // Storage rebate (Sui provides rebate for storage)
    const storageRebate = Math.floor(storageCost * 0.9);

    // Total gas needed
    const totalGas = computationCost + storageCost - storageRebate;

    // Apply multiplier for safety
    const gasBudget = Math.max(
      Math.floor(totalGas * this.GAS_BUDGET_MULTIPLIER),
      this.MIN_GAS_BUDGET
    );

    return {
      gasBudget,
      gasPrice: this.DEFAULT_GAS_PRICE,
      computationCost,
      storageCost,
      storageRebate,
    };
  }

  /**
   * Estimate computation cost based on transaction size
   */
  private estimateComputationCost(txSize: number): number {
    // Base computation cost
    const baseCost = 500;
    // Cost per byte
    const perByteCost = 2;
    return baseCost + (txSize * perByteCost);
  }

  /**
   * Estimate storage cost
   */
  private estimateStorageCost(txSize: number): number {
    // Storage is charged per byte written
    const storagePerByte = 100;
    return txSize * storagePerByte;
  }

  /**
   * Convert gas estimate to SUI
   */
  gasToSui(gasMIST: number): number {
    return gasMIST / 1_000_000_000;
  }

  /**
   * Convert SUI to gas units
   */
  suiToGas(suiAmount: number): number {
    return Math.floor(suiAmount * 1_000_000_000);
  }
}

export const gasService = new GasService();

