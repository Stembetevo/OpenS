#!/usr/bin/env tsx

/**
 * Test transaction bytes validation
 * Run with: npm run test-tx <base64_tx_bytes>
 */

import { fromB64 } from '@mysten/sui/utils';

const txBase64 = process.argv[2];

if (!txBase64) {
  console.error('Usage: npm run test-tx <base64_tx_bytes>');
  process.exit(1);
}

console.log('\n🧪 Testing Transaction Bytes...\n');
console.log('Input (base64):',txBase64.substring(0, 100) + '...');
console.log('Length:', txBase64.length);

try {
  // Decode from base64
  const txBytes = fromB64(txBase64);
  console.log('\n✅ Base64 decode successful');
  console.log('Decoded length:', txBytes.length, 'bytes');
  console.log('First 32 bytes (hex):', Buffer.from(txBytes.slice(0, 32)).toString('hex'));
  console.log('First 20 bytes (array):', Array.from(txBytes.slice(0, 20)));
  
  // Check structure
  if (txBytes.length < 10) {
    console.log('\n❌ Transaction too short - likely corrupted');
    process.exit(1);
  }
  
  // Sui transactions typically start with version byte
  console.log('\n📋 Transaction structure:');
  console.log('Version byte:', txBytes[0]);
  
  // Try to parse more details
  console.log('\n🔍 Basic validation:');
  
  if (txBytes[0] === 0) {
    console.log('✅ Has valid version marker');
  } else {
    console.log('⚠️  Unexpected version byte:', txBytes[0]);
  }
  
  console.log('\n✅ Transaction bytes appear valid for submission');
  console.log('You can try sponsoring this transaction.');
  
} catch (error) {
  console.error('\n❌ Error processing transaction:', error);
  console.log('\nThis transaction is malformed and cannot be sponsored.');
  process.exit(1);
}
