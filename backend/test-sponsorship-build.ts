#!/usr/bin/env tsx

/**
 * Test building transaction with onlyTransactionKind option
 * This might be needed for gas sponsorship
 */

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { toB64 } from '@mysten/sui/utils';
import axios from 'axios';

const WALLET_ADDRESS = '0x1a808d3cb5f81c5f99608ff57ef15b5e6755f90a051b8aa45dbd0939257988a3';
const API_KEY = "us1_sui_testnet_eb7f095ed2d649fab90d6bc0b9a70fc2";
const ENDPOINT = "https://api.us1.shinami.com/gas/v1";

async function testSponsorshipBuild() {
  console.log('\n🔧 Testing transaction build for sponsorship...\n');

  const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

  const tx = new Transaction();
  tx.setSender(WALLET_ADDRESS);
  
  // For sponsored transactions, we can't use tx.gas
  // Let's try a simple move call instead
  tx.moveCall({
    target: '0x2::random::create',
    arguments: [],
  });

  console.log('Building with onlyTransactionKind...');
  try {
    const txBytesKindOnly = await tx.build({ 
      client,
      onlyTransactionKind: true 
    });
    
    const txBase64 = toB64(txBytesKindOnly);
    
    console.log('✅ Built successfully');
    console.log('   Bytes length:', txBytesKindOnly.length);
    console.log('   Base64 length:', txBase64.length);
    console.log('   First bytes:', Array.from(txBytesKindOnly.slice(0, 20)));
    
    console.log('\n📤 Testing with Shinami...');
    const response = await axios.post(
      ENDPOINT,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'gas_sponsorTransactionBlock',
        params: [txBase64, WALLET_ADDRESS],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
      }
    );
    
    if (response.data.error) {
      console.log('❌ Shinami Error:', response.data.error);
    } else {
      console.log('✅ SUCCESS! Shinami accepted it!');
      console.log(response.data.result);
    }
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('   Response:', error.response.data);
    }
  }
}

testSponsorshipBuild().catch(console.error);
