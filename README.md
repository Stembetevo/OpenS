# OpenSignal - Sui Gas Sponsorship Platform

A complete platform for sponsoring Sui blockchain transactions. Consists of a backend API and a frontend interface.

## Project Structure

```
opensignal/
├── backend/            # FastAPI backend server
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   ├── middleware/ # Authentication, etc.
│   │   └── index.ts    # Main server file
│   └── package.json
│
└── client/             # React + Vite frontend
    ├── src/
    │   ├── components/ # React components
    │   ├── api/        # API client
    │   ├── store/      # State management
    │   └── main.tsx    # Entry point
    └── package.json
```

## Quick Start

### Backend Setup

```bash
cd backend
npm install

# Create test data
npx tsx test-setup.ts

# Start the server
npm run dev
```

Server runs on `http://localhost:3000`

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Usage

### For Marketplace Projects

When a user wants to mint/buy an NFT with gas sponsorship:

```typescript
// In your marketplace (e.g., NFT minting)
const txBlock = "..."; // Your transaction bytes
const walletAddress = "0x...";

// Redirect to OpenSignal
const redirectUrl = `http://localhost:3000/sponsor?tx=${encodeURIComponent(txBlock)}&walletAddress=${walletAddress}&callbackUrl=${window.location.href}`;
window.location.href = redirectUrl;
```

### The Flow

1. **Marketplace** creates transaction and redirects to OpenSignal
2. **OpenSignal Frontend** displays transaction details and gas estimate
3. **User** reviews and approves the sponsorship
4. **OpenSignal Backend** sponsors the transaction via Shinami
5. **Browser** redirects back to marketplace with signed transaction
6. **Marketplace** executes the sponsored transaction

## API Endpoints

### Public Endpoints (No Auth Required)

- `GET /sponsor?tx=<bytes>&walletAddress=<address>&callbackUrl=<url>`
  - Redirect endpoint for frontend sponsor page

- `POST /api/sponsor-verify`
  - Verify transaction and get gas estimate
  - Body: `{ txBlock, walletAddress }`

- `POST /api/sponsor-public`
  - Sponsor a transaction
  - Body: `{ txBlock, walletAddress, callbackUrl }`

### Protected Endpoints (Require `x-api-key` Header)

- `POST /api/simulate`
  - Simulate transaction execution
  
- `POST /api/sponsor`
  - Sponsor transaction (for authenticated dApps)
  
- `POST /api/submit`
  - Submit prepared transaction
  
- `GET /api/status/:txDigest`
  - Get transaction status

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://...
SHINAMI_GAS_API_KEY=us1_sui_testnet_...
SUI_RPC_URL=https://fullnode.testnet.sui.io
PORT=3000
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:3000
```

## Testing

### Test the backend API

```bash
cd backend
./test-api.sh
```

### Manual Test with NFT Marketplace

1. Open your NFT marketplace
2. Click "Mint" or "Buy"
3. System redirects to OpenSignal
4. Review and approve gas sponsorship
5. Redirects back with signed transaction
6. Transaction executes

## Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd client
npm run build
# Deploy dist/ folder to static hosting
```

## Next Steps

- [ ] Add rate limiting
- [ ] Add sponsor dashboard
- [ ] Add usage analytics
- [ ] Add webhook support
- [ ] Add TypeScript SDK for easy integration
- [ ] Deploy to production

## License

MIT
