import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import dotenv from 'dotenv';
import { authenticateApiKey } from './middleware/auth.js';
import { simulateHandler, simulateSchema } from './routes/simulate.js';
import { sponsorHandler, sponsorSchema } from './routes/sponsor.js';
import { submitHandler, submitSchema } from './routes/submit.js';
import { statusHandler, statusSchema } from './routes/status.js';
import { publicSponsorHandler, publicSponsorSchema, verifySponsorHandler } from './routes/publicSponsor.js';

// Load environment variables
dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Enable CORS for all routes
await fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true,
});


// Set the validator and serializer for Zod
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API Routes with authentication
fastify.post(
  '/api/simulate',
  {
    schema: {
      body: simulateSchema,
      response: {
        200: {},
      },
    },
    preHandler: authenticateApiKey,
  },
  simulateHandler as any
);

fastify.post(
  '/api/sponsor',
  {
    schema: {
      body: sponsorSchema,
    },
    preHandler: authenticateApiKey,
  },
  sponsorHandler as any
);

fastify.post(
  '/api/submit',
  {
    schema: {
      body: submitSchema,
    },
    preHandler: authenticateApiKey,
  },
  submitHandler as any
);

fastify.get(
  '/api/status/:txDigest',
  {
    schema: {
      params: statusSchema,
    },
  },
  statusHandler
);

// Public sponsor endpoints (no API key required)
fastify.post(
  '/api/sponsor-verify',
  {
    schema: {
      body: publicSponsorSchema,
    },
  },
  verifySponsorHandler
);

fastify.post(
  '/api/sponsor-public',
  {
    schema: {
      body: publicSponsorSchema,
    },
  },
  publicSponsorHandler
);

// Redirect endpoint for frontend
fastify.get('/sponsor', async (request, reply) => {
  const { tx, walletAddress, callbackUrl } = request.query as {
    tx?: string;
    walletAddress?: string;
    callbackUrl?: string;
  };

  if (!tx || !walletAddress) {
    reply.status(400).send({
      success: false,
      error: 'Missing required parameters: tx, walletAddress',
    });
    return;
  }

  // Redirect to frontend with transaction details
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const params = new URLSearchParams({
    tx: decodeURIComponent(tx),
    walletAddress,
    ...(callbackUrl && { callbackUrl }),
  });

  reply.redirect(`${frontendUrl}/sponsor?${params.toString()}`);
});

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  if (error.validation) {
    reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.validation,
    });
    return;
  }

  reply.status(500).send({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`OpenSignal server running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

