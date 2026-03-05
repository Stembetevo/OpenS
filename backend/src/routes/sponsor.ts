import { z } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { createSuiService } from '../services/sui.js';
import { createShinamiService } from '../services/shinami.js';
import { gasService } from '../services/gas.js';
import { validationService } from '../services/validation.js';

const prisma = new PrismaClient();

// Request validation schema
export const sponsorSchema = z.object({
  txBlock: z.string().min(1, 'Transaction block is required'),
  walletAddress: z.string().min(1, 'Wallet address is required'),
});

export type SponsorBody = z.infer<typeof sponsorSchema>;

// Route handler
export async function sponsorHandler(
  request: FastifyRequest<{ Body: SponsorBody }>,
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
    const shinamiService = createShinamiService();

    // Step 1: Simulate the transaction first
    const simulation = await suiService.simulateTransaction(txBlock);

    if (!simulation.success) {
      await prisma.transactionLog.create({
        data: {
          walletAddress,
          packageId: 'unknown',
          status: 'simulation_failed',
          dAppPartnerId,
        },
      });

      reply.status(400).send({
        success: false,
        error: simulation.error || 'Transaction simulation failed',
      });
      return;
    }

    // Step 2: Validate business rules
    // Check daily transaction limit
    const dailyLimitCheck = await validationService.checkDailyTxLimit(walletAddress, dAppPartnerId);
    if (!dailyLimitCheck.valid) {
      reply.status(400).send({
        success: false,
        error: dailyLimitCheck.error,
      });
      return;
    }

    // Extract package ID and check allowlist
    const packageId = suiService.extractPackageId(txBlock);
    if (packageId) {
      const allowlistCheck = await validationService.checkPackageAllowlist(packageId, dAppPartnerId);
      if (!allowlistCheck.valid) {
        reply.status(400).send({
          success: false,
          error: allowlistCheck.error,
        });
        return;
      }
    }

    // Check gas limit
    const gasEstimate = await gasService.estimateGas(txBlock);
    const gasLimitCheck = validationService.checkGasLimit(gasEstimate.gasBudget);
    if (!gasLimitCheck.valid) {
      reply.status(400).send({
        success: false,
        error: gasLimitCheck.error,
      });
      return;
    }

    // Step 3: Call Shinami to sponsor the transaction
    const sponsoredTx = await shinamiService.sponsorTransactionBlock(
      txBlock,
      walletAddress,
      gasEstimate.gasBudget
    );

    // Step 4: Log the transaction attempt
    await prisma.transactionLog.create({
      data: {
        walletAddress,
        packageId: packageId || 'unknown',
        status: 'sponsored',
        gasUsed: gasEstimate.gasBudget,
        dAppPartnerId,
      },
    });

    // Step 5: Increment daily transaction count
    await validationService.incrementDailyTxCount(walletAddress, dAppPartnerId);

    reply.status(200).send({
      success: true,
      sponsoredTxBlock: sponsoredTx.txBytes,
      txDigest: sponsoredTx.txDigest,
      sponsorSignature: sponsoredTx.signature,
      gasBudget: gasEstimate.gasBudget,
      expireAtTime: sponsoredTx.expireAtTime,
      expireAfterEpoch: sponsoredTx.expireAfterEpoch,
    });
  } catch (error: unknown) {
    request.log.error(error, 'Error in sponsor endpoint');
    
    // Log failed transaction
    try {
      await prisma.transactionLog.create({
        data: {
          walletAddress,
          packageId: 'unknown',
          status: 'error',
          dAppPartnerId,
        },
      });
    } catch (logError) {
      request.log.error(logError, 'Failed to log transaction error');
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    reply.status(500).send({
      success: false,
      error: `Failed to sponsor transaction: ${errorMessage}`,
    });
  }
}

