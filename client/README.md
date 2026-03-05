# OpenSignal Frontend

React + TypeScript + Vite frontend for the OpenSignal gas sponsorship service.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Configuration

Set the API URL via environment variable:

```bash
VITE_API_URL=http://localhost:3000 npm run dev
```

## Usage

The frontend provides a sponsor page that can be accessed via:

```
http://localhost:5173/sponsor?tx=<transaction_bytes>&walletAddress=<address>&callbackUrl=<url>
```

### Parameters:
- `tx` - Transaction block bytes (required)
- `walletAddress` - User's wallet address (required)
- `callbackUrl` - URL to redirect after sponsoring (optional)
