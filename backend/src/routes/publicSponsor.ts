import { z } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';
import { createShinamiService } from '../services/shinami.js';
import { gasService } from '../services/gas.js';

// Public sponsor endpoint schema (no API key required)
export const publicSponsorSchema = z.object({
  txBlock: z.string().min(1, 'Transaction block is required'),
  walletAddress: z.string().min(1, 'Wallet address is required'),
  callbackUrl: z.string().url('Invalid callback URL').optional(),
});

export type PublicSponsorBody = z.infer<typeof publicSponsorSchema>;

export async function publicSponsorHandler(
  request: FastifyRequest<{ Body: PublicSponsorBody }>,
  reply: FastifyReply
): Promise<void> {
  const { txBlock, walletAddress, callbackUrl } = request.body;

  try {
    request.log.info({ 
      txBlockLength: txBlock.length,
      txBlockPreview: txBlock.substring(0, 100), 
      walletAddress 
    }, 'Attempting to sponsor transaction');
    
    // Validate transaction bytes format (should be base64)
    if (!isValidBase64(txBlock)) {
      throw new Error('Transaction block must be valid base64 encoded string');
    }
    
    // Decode and inspect the transaction bytes
    const decoded = Buffer.from(txBlock, 'base64');
    request.log.info({ 
      decodedLength: decoded.length,
      firstBytesHex: decoded.slice(0, 32).toString('hex'),
      firstBytesArray: Array.from(decoded.slice(0, 20))
    }, 'Decoded transaction bytes');
    
    const shinamiService = createShinamiService();

    // Sponsor the transaction - txBlock should be base64 encoded transaction bytes
    const sponsorResponse = await shinamiService.sponsorTransactionBlock(
      txBlock, 
      walletAddress
    );

    request.log.info('Transaction sponsored successfully');
    request.log.info({ digest: sponsorResponse.txDigest }, 'Sponsored transaction digest');

    const response = {
      success: true,
      sponsoredTxBlock: sponsorResponse.txBytes,
      txDigest: sponsorResponse.txDigest,
      sponsorSignature: sponsorResponse.signature,
      expireAtTime: sponsorResponse.expireAtTime,
      expireAfterEpoch: sponsorResponse.expireAfterEpoch,
      callbackUrl,
    };

    reply.status(200).send(response);
  } catch (error: unknown) {
    request.log.error({ 
      error: error instanceof Error ? { 
        message: error.message, 
        stack: error.stack 
      } : error, 
      walletAddress 
    }, 'Failed to sponsor transaction');
    
    reply.status(400).send({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sponsor transaction',
    });
  }
}

// Helper function to validate base64
function isValidBase64(str: string): boolean {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
}

// Endpoint to verify transaction before sponsoring
export async function verifySponsorHandler(
  request: FastifyRequest<{ Body: PublicSponsorBody }>,
  reply: FastifyReply
): Promise<void> {
  const { txBlock, walletAddress } = request.body;

  try {
    // Estimate gas
    const gasEstimate = await gasService.estimateGas(txBlock);

    reply.status(200).send({
      success: true,
      gasEstimate,
      walletAddress,
    });
  } catch (error: unknown) {
    request.log.error(error);
    reply.status(400).send({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to estimate gas',
    });
  }
}
