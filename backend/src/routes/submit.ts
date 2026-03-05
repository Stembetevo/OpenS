import { z } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createSuiService } from '../services/sui.js';

const prisma = new PrismaClient();

// Request validation schema
export const submitSchema = z.object({
  signedTxBlock: z.string().min(1, 'Signed transaction block is required'),
});

export type SubmitBody = z.infer<typeof submitSchema>;

// Route handler
export async function submitHandler(
  request: FastifyRequest<{ Body: SubmitBody }>,
  reply: FastifyReply
): Promise<void> {
  const authenticatedRequest = request as AuthenticatedRequest;
  const { signedTxBlock } = request.body;
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

    // Submit the transaction to Sui network
    const result = await suiService.submitTransaction(signedTxBlock);

    // Update transaction log with txDigest
    // Note: In a real implementation, we would need to track which transaction this corresponds to
    // For now, we'll find the most recent pending transaction for this dApp
    const pendingTx = await prisma.transactionLog.findFirst({
      where: {
        dAppPartnerId,
        status: 'sponsored',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (pendingTx) {
      await prisma.transactionLog.update({
        where: { id: pendingTx.id },
        data: {
          txDigest: result.txDigest,
          status: 'submitted',
        },
      });
    }

    reply.status(200).send({
      success: true,
      txDigest: result.txDigest,
      status: 'submitted',
    });
  } catch (error: unknown) {
    request.log.error(error, 'Error in submit endpoint');

    // Log failed submission
    try {
      await prisma.transactionLog.create({
        data: {
          walletAddress: 'unknown',
          packageId: 'unknown',
          status: 'submission_failed',
          dAppPartnerId,
        },
      });
    } catch (logError) {
      request.log.error(logError, 'Failed to log submission error');
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    reply.status(500).send({
      success: false,
      error: `Failed to submit transaction: ${errorMessage}`,
    });
  }
}

