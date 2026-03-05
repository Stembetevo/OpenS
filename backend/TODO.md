# OpenSignal Backend - Implementation Plan

## Project Overview
- **Project Name**: OpenSignal
- **Type**: Sui Blockchain Sponsored Transaction Execution Layer
- **Core Functionality**: Middleware between Sui dApps and Sui network, sponsoring gas fees using Shinami's Gas Station API
- **Target Users**: Sui dApp developers who want to sponsor gas fees for their users

## Information Gathered

### Tech Stack
- Runtime: Node.js with TypeScript
- Framework: Fastify
- Database: PostgreSQL with Prisma ORM
- Blockchain: Sui TypeScript SDK (@mysten/sui)
- Gas Sponsorship: Shinami Gas Station API
- Auth: API key based authentication

### Database Models (Prisma)
1. **DAppPartner**: id, name, apiKey, createdAt
2. **AllowedPackage**: id, packageId, dAppPartnerId, createdAt
3. **TransactionLog**: id, walletAddress, packageId, txDigest, gasUsed, status, createdAt, dAppPartnerId
4. **WalletDailyUsage**: id, walletAddress, date, txCount, dAppPartnerId

### API Endpoints
1. **POST /api/simulate** - Simulates transaction, returns gas estimate
2. **POST /api/sponsor** - Sponsors transaction via Shinami
3. **POST /api/submit** - Submits signed transaction to Sui
4. **GET /api/status/:txDigest** - Gets transaction status

### Business Rules
- Max gas per transaction: 0.05 SUI
- Daily tx limit: 10 per wallet per dApp
- Only allow Move package IDs in dApp's allowlist
- Reject any transaction that fails simulation

## Plan

### Phase 1: Project Setup
1.1 Create project directory structure
1.2 Initialize npm project and install dependencies
1.3 Create TypeScript configuration
1.4 Create .env.example file

### Phase 2: Database & Prisma
2.1 Create Prisma schema with all models
2.2 Create database seed script with test data
2.3 Generate Prisma client

### Phase 3: Services Layer
3.1 Create Shinami API wrapper service
3.2 Create Sui RPC interaction service
3.3 Create validation service (business rules)
4.4 Create gas estimation service

### Phase 4: Middleware
4.1 Create API key authentication middleware

### Phase 5: Routes
5.1 Create simulate route
5.2 Create sponsor route
5.3 Create submit route
5.4 Create status route

### Phase 6: Server Entry Point
6.1 Create main index.ts with Fastify setup
6.2 Configure logging and error handling

### Phase 7: Documentation
7.1 Create README with setup instructions
7.2 Add example API calls using curl

## Files to Create

### Configuration Files
- package.json
- tsconfig.json
- .env.example

### Database
- prisma/schema.prisma
- prisma/seed.ts

### Services
- src/services/shinami.ts
- src/services/sui.ts
- src/services/validation.ts
- src/services/gas.ts

### Middleware
- src/middleware/auth.ts

### Routes
- src/routes/simulate.ts
- src/routes/sponsor.ts
- src/routes/submit.ts
- src/routes/status.ts

### Main Entry
- src/index.ts

### Documentation
- README.md

## Dependencies
- fastify
- @fastify/type-provider-zod
- @mysten/sui
- @prisma/client
- prisma
- zod
- dotenv
- axios (for Shinami API calls)

## Follow-up Steps
1. Install dependencies
2. Set up PostgreSQL database
3. Run Prisma migrations
4. Seed database
5. Test API endpoints

