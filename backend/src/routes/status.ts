import { z } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';
import { createSuiService } from '../services/sui.js';

// Request validation schema
export const statusSchema = z.object({
  txDigest: z.string().min(1, 'Transaction digest is required'),
});

export type StatusParams = z.infer<typeof statusSchema>;

// Route handler
export async function statusHandler(
  request: FastifyRequest<{ Params: StatusParams }>,
  reply: FastifyReply
): Promise<void> {
  const { txDigest } = request.params;

  try {
    const suiService = createSuiService();

    // Get transaction status from Sui network
    const status = await suiService.getTransactionStatus(txDigest);

    reply.status(200).send({
      success: true,
      txDigest: status.txDigest,
      status: status.status,
      gasUsed: status.gasUsed,
      timestamp: status.timestamp,
    });
  } catch (error: unknown) {
    request.log.error(error, 'Error in status endpoint');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    reply.status(500).send({
      success: false,
      error: `Failed to get transaction status: ${errorMessage}`,
    });
  }
}

