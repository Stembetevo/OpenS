#!/usr/bin/env tsx

/**
 * Test script to verify Shinami Gas Station API connectivity
 * 
 * This script tests:
 * 1. Environment variables are set
 * 2. Shinami API endpoint is accessible
 * 3. API key authentication works
 * 
 * Usage:
 *   npm run test-shinami
 */

import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function testShinamiConnection() {
  console.log('\n🧪 Testing Shinami Gas Station API Connection...\n');

  // Step 1: Check environment variables
  console.log('1️⃣  Checking environment variables...');
  const apiKey = process.env.SHINAMI_GAS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ SHINAMI_GAS_API_KEY is not set in .env file');
    console.log('\nPlease add the following to your .env file:');
    console.log('SHINAMI_GAS_API_KEY=your_shinami_api_key_here\n');
    process.exit(1);
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 15) + '...');
  const region = apiKey.split('_')[0];
  console.log('✅ API Key region:', region);
  
  // Build regional endpoint
  const SHINAMI_GAS_API_URL = `https://api.${region}.shinami.com/gas/v1`;

  // Step 2: Test API endpoint accessibility
  console.log('\n2️⃣  Testing Shinami API endpoint...');
  console.log('📡 Endpoint:', SHINAMI_GAS_API_URL);

  try {
    // Make a test call with minimal valid params to test authentication
    // We use a dummy sender address for testing
    const response = await axios.post(
      SHINAMI_GAS_API_URL,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'gas_sponsorTransactionBlock',
        params: [
          'AAAA', // Minimal invalid transaction for testing
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        validateStatus: () => true, // Accept any status code
      }
    );

    console.log('📥 Response status:', response.status);
    console.log('📦 Response data:', JSON.stringify(response.data, null, 2));

    if (response.status === 401 || response.status === 403) {
      console.error('\n❌ Authentication failed! Check your API key.');
      process.exit(1);
    }

    if (response.data.error) {
      // If we get an error about invalid transaction, that's actually good!
      // It means authentication worked, just the transaction was invalid
      if (response.data.error.message && 
          (response.data.error.message.includes('invalid') || 
           response.data.error.message.includes('deserialize') ||
           response.data.error.message.includes('decode'))) {
        console.log('\n✅ API authentication successful!');
        console.log('✅ Shinami Gas Station is accessible');
        console.log('ℹ️  Error is expected (we sent an invalid test transaction)');
      } else {
        console.warn('\n⚠️  Unexpected error:', response.data.error.message);
        console.log('This might indicate an issue with the API or your configuration.');
      }
    } else if (response.data.result) {
      console.log('\n✅ API call successful!');
      console.log('✅ Received valid response from Shinami');
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('\n❌ Network error connecting to Shinami:');
      console.error('   ', error.message);
      
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      console.log('\nTroubleshooting:');
      console.log('- Check your internet connection');
      console.log('- Verify the API endpoint is correct');
      console.log('- Ensure firewall/proxy is not blocking requests');
    } else {
      console.error('\n❌ Unexpected error:', error);
    }
    process.exit(1);
  }

  // Step 3: Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ Shinami Connection Test Complete!');
  console.log('='.repeat(60));
  console.log('\n✅ You can now test with actual transactions from your marketplace.');
  console.log('\n📚 See FIXES_APPLIED.md for testing instructions.\n');
}

// Run the test
testShinamiConnection().catch((error) => {
  console.error('\n💥 Test failed with error:', error);
  process.exit(1);
});
