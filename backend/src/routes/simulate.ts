import { z } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createSuiService } from '../services/sui.js';
import { gasService } from '../services/gas.js';

// Request validation schema
export const simulateSchema = z.object({
  txBlock: z.string().min(1, 'Transaction block is required'),
  walletAddress: z.string().min(1, 'Wallet address is required'),
});

export type SimulateBody = z.infer<typeof simulateSchema>;

// Route handler
export async function simulateHandler(
  request: FastifyRequest<{ Body: SimulateBody }>,
  reply: FastifyReply
): Promise<void> {
  const authenticatedRequest = request as AuthenticatedRequest;
  const { txBlock, walletAddress } = request.body;
  const dAppPartnerId = authenticatedRequest.dAppPartnerId;

  if (!dAppPartnerId) {
    reply.status(401).send({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    const suiService = createSuiService();

    // Simulate the transaction
    const simulation = await suiService.simulateTransaction(txBlock);

    if (!simulation.success) {
      reply.status(400).send({
        success: false,
        error: simulation.error || 'Transaction simulation failed',
      });
      return;
    }

    // Estimate gas
    const gasEstimate = await gasService.estimateGas(txBlock);

    reply.status(200).send({
      success: true,
      gasEstimate: gasEstimate.gasBudget,
      gasEstimateSui: gasService.gasToSui(gasEstimate.gasBudget),
    });
  } catch (error: unknown) {
    request.log.error(error, 'Error in simulate endpoint');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    reply.status(500).send({
      success: false,
      error: `Internal server error: ${errorMessage}`,
    });
  }
}

