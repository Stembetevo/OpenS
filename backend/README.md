# OpenSignal Backend

A Sui blockchain sponsored transaction execution layer that acts as middleware between Sui dApps and the Sui network, sponsoring gas fees on behalf of end users using Shinami's Gas Station API.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL (Prisma ORM)
- **Blockchain**: Sui TypeScript SDK (@mysten/sui)
- **Gas Sponsorship**: Shinami Gas Station API

## Prerequisites

1. Node.js >= 18.0.0
2. PostgreSQL database
3. Shinami Gas Station API key

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd opensignal-backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/opensignal?schema=public"
SHINAMI_GAS_API_KEY="your_shinami_gas_api_key_here"
SUI_RPC_URL="https://fullnode.testnet.sui.io"
PORT=3000
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed test data
npm run db:seed
```

### 4. Build the Project

```bash
npm run build
```

### 5. Start the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### POST /api/simulate

Simulate a transaction to estimate gas usage.

**Headers:**
- `x-api-key`: Your dApp's API key

**Request Body:**
```json
{
  "txBlock": "base64_encoded_transaction_block",
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "gasEstimate": 1000000,
  "gasEstimateSui": 0.001
}
```

### POST /api/sponsor

Sponsor a transaction using Shinami Gas Station.

**Headers:**
- `x-api-key`: Your dApp's API key

**Request Body:**
```json
{
  "txBlock": "base64_encoded_transaction_block",
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "sponsoredTxBlock": "base64_encoded_sponsored_tx",
  "sponsorSignature": "signature_string",
  "gasBudget": 1000000
}
```

### POST /api/submit

Submit a signed transaction to the Sui network.

**Headers:**
- `x-api-key`: Your dApp's API key

**Request Body:**
```json
{
  "signedTxBlock": "base64_encoded_signed_transaction"
}
```

**Response:**
```json
{
  "success": true,
  "txDigest": "0x...",
  "status": "submitted"
}
```

### GET /api/status/:txDigest

Get the status of a submitted transaction.

**Response:**
```json
{
  "success": true,
  "txDigest": "0x...",
  "status": "success",
  "gasUsed": 1000,
  "timestamp": 1699999999
}
```

## Example API Calls (cURL)

### Simulate Transaction

```bash
curl -X POST http://localhost:3000/api/simulate \
  -H "Content-Type: application/json" \
  -H "x-api-key: test_api_key_12345" \
  -d '{
    "txBlock": "AQAAAA==",
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
  }'
```

### Sponsor Transaction

```bash
curl -X POST http://localhost:3000/api/sponsor \
  -H "Content-Type: application/json" \
  -H "x-api-key: test_api_key_12345" \
  -d '{
    "txBlock": "AQAAAA==",
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
  }'
```

### Submit Transaction

```bash
curl -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -H "x-api-key: test_api_key_12345" \
  -d '{
    "signedTxBlock": "AQAAAA=="
  }'
```

### Get Transaction Status

```bash
curl -X GET http://localhost:3000/api/status/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Health Check

```bash
curl -X GET http://localhost:3000/health
```

## Business Rules

- **Max gas per transaction**: 0.05 SUI
- **Daily transaction limit**: 10 transactions per wallet per dApp
- **Package allowlist**: Only Move package IDs in the dApp's allowlist can be sponsored
- **Simulation required**: Transactions must pass simulation before being sponsored

## Project Structure

```
opensignal-backend/
├── src/
│   ├── routes/
│   │   ├── simulate.ts    # Transaction simulation endpoint
│   │   ├── sponsor.ts     # Gas sponsorship endpoint
│   │   ├── submit.ts      # Transaction submission endpoint
│   │   └── status.ts      # Transaction status endpoint
│   ├── services/
│   │   ├── shinami.ts     # Shinami API wrapper
│   │   ├── sui.ts         # Sui RPC interactions
│   │   ├── validation.ts  # Business rule enforcement
│   │   └── gas.ts          # Gas estimation logic
│   ├── middleware/
│   │   └── auth.ts         # API key validation
│   ├── prisma/
│   │   └── schema.prisma   # Database models
│   └── index.ts            # Server entry point
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## Database Models

### DAppPartner
- `id`: UUID primary key
- `name`: dApp name
- `apiKey`: Unique API key for authentication
- `createdAt`: Timestamp

### AllowedPackage
- `id`: UUID primary key
- `packageId`: Move package ID
- `dAppPartnerId`: Foreign key to DAppPartner
- `createdAt`: Timestamp

### TransactionLog
- `id`: UUID primary key
- `walletAddress`: User's wallet address
- `packageId`: Move package ID
- `txDigest`: Sui transaction digest
- `gasUsed`: Gas used in MIST
- `status`: Transaction status
- `createdAt`: Timestamp
- `dAppPartnerId`: Foreign key to DAppPartner

### WalletDailyUsage
- `id`: UUID primary key
- `walletAddress`: User's wallet address
- `date`: Date (unique with walletAddress and dAppPartnerId)
- `txCount`: Number of transactions today
- `dAppPartnerId`: Foreign key to DAppPartner

## License

MIT

