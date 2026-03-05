#!/bin/bash

# Test Shinami API directly with the valid transaction

TX_BYTES="AAADAAkIVGVzdCBORlQAERBUZXN0IERlc2NyaXB0aW9uACopaHR0cHM6Ly9pLmliYi5jby82MG5raEg4ZC9DUkUtZGlhZ3JhbS5wbmcBAAnB5Ri9QZ2nvLH3Air+q6qsVtX2F4zD7PWXmm4ww7cDC3Rlc3RuZXRfbmZ0Dm1pbnRfdG9fc2VuZGVyAAMBAAABAQABAgAagI08tfgcX5lgj/V+8VteZ1X5CgUbiqRdvQk5JXmIowEih/Tscy15fzf4WLQrzy/joqqkuddPLlPFKyPF3FMHJwocdCcAAAAAIN+hUWHWcCBq7Qd/c+Ppw9tMoD5jOZRBoR+eocw36cb9GoCNPLX4HF+ZYI/1fvFbXmdV+QoFG4qkXb0JOSV5iKPoAwAAAAAAAADh9QUAAAAAAA=="
SENDER="0x1a808d3cb5f81c5f99608ff57ef15b5e6755f90a051b8aa45dbd0939257988a3"
API_KEY="us1_sui_testnet_eb7f095ed2d649fab90d6bc0b9a70fc2"

echo "Testing Shinami API directly..."
echo "TX Bytes length: ${#TX_BYTES}"
echo "Sender: $SENDER"
echo ""

curl -X POST https://api.us1.shinami.com/gas/v1 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"gas_sponsorTransactionBlock\",
    \"params\": [\"$TX_BYTES\", \"$SENDER\"]
  }" | jq .

echo ""
echo "Done!"
