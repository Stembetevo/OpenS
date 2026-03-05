import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends FastifyRequest {
  dAppPartnerId?: string;
}

/**
 * API Key authentication middleware
 * Validates the x-api-key header against the database
 */
export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers['x-api-key'];

  if (!apiKey) {
    reply.status(401).send({
      success: false,
      error: 'API key is required. Please provide x-api-key header.',
    });
    return;
  }

  if (typeof apiKey !== 'string') {
    reply.status(401).send({
      success: false,
      error: 'Invalid API key format.',
    });
    return;
  }

  try {
    const dAppPartner = await prisma.dAppPartner.findUnique({
      where: { apiKey },
    });

    if (!dAppPartner) {
      reply.status(401).send({
        success: false,
        error: 'Invalid API key.',
      });
      return;
    }

    // Attach dAppPartnerId to request for use in routes
    (request as AuthenticatedRequest).dAppPartnerId = dAppPartner.id;
  } catch (error) {
    request.log.error(error, 'Error validating API key');
    reply.status(500).send({
      success: false,
      error: 'Internal server error during authentication.',
    });
  }
}

/**
 * Decorator function to add authenticateApiKey to Fastify
 */
export function setupAuthMiddleware(fastify: any): void {
  fastify.decorate('authenticate', authenticateApiKey);
}

