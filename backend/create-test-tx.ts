#!/usr/bin/env tsx

/**
 * Test creating a valid Sui transaction for OpenSignal sponsorship
 * This creates a REAL transaction that should work with Shinami
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { toB64 } from '@mysten/sui/utils';

const WALLET_ADDRESS = '0x1a808d3cb5f81c5f99608ff57ef15b5e6755f90a051b8aa45dbd0939257988a3';
// Using a well-known Sui testnet package
const PACKAGE_ID = '0x2';  // Sui framework

async function createValidTransaction() {
  console.log('\n🔧 Creating a valid sponsored transaction...\n');

  // 1. Initialize client
  const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

  // 2. Create transaction
  const tx = new Transaction();
  
  // 3. Set sender (REQUIRED)
  tx.setSender(WALLET_ADDRESS);
  
  // 4. Add a simple contract call (clock::create is an entry function in Sui framework)
  // NOTE: Don't use tx.gas in sponsored transactions!
  tx.moveCall({
    target: `${PACKAGE_ID}::coin::create_regulated_currency`,
    arguments: [
      tx.pure.u8(9), // decimals
      tx.pure.string('TST'), // symbol
      tx.pure.string('Test Token'), // name
      tx.pure.string('A test token'), // description
      tx.pure.option('string', null), // icon_url
    ],
    typeArguments: ['0x2::sui::SUI'],
  });

  console.log('✅ Transaction configured');
  console.log('   Sender:', WALLET_ADDRESS);
  console.log('   Package:', PACKAGE_ID);

  // 6. Build transaction FOR GAS SPONSORSHIP
  console.log('\n📦 Building transaction with onlyTransactionKind: true...');
  
  const txBytes = await tx.build({ 
    client,
    onlyTransactionKind: true  // REQUIRED for gas sponsorship!
  });
  
  console.log('✅ Transaction built successfully');
  console.log('   Bytes length:', txBytes.length);
  console.log('   First bytes:', Array.from(txBytes.slice(0, 20)));

  // 7. Convert to base64
  const txBase64 = toB64(txBytes);
  
  console.log('\n🔐 Transaction encoded to base64:');
  console.log('   Base64 length:', txBase64.length);
  console.log('   Base64:', txBase64);

  // 8. Create OpenSignal URL
  const opensignalUrl = 'http://localhost:5173';
  const callbackUrl = 'http://localhost:5174/mint-callback';
  
  const sponsorUrl = 
    `${opensignalUrl}/sponsor?` +
    `tx=${encodeURIComponent(txBase64)}` +
    `&walletAddress=${WALLET_ADDRESS}` +
    `&callbackUrl=${encodeURIComponent(callbackUrl)}`;

  console.log('\n🚀 OpenSignal Sponsor URL:');
  console.log(sponsorUrl);
  
  console.log('\n📋 Next steps:');
  console.log('1. Copy the URL above');
  console.log('2. Paste it in your browser');
  console.log('3. OpenSignal should sponsor the transaction');
  console.log('4. Check for success or errors\n');
}

createValidTransaction().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
