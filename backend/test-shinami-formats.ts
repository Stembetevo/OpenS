#!/usr/bin/env tsx

/**
 * Test different parameter formats with Shinami API
 */

import axios from 'axios';

const TX_BYTES = "AAACAAhAQg8AAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAgABAQAAAQEDAAAAAAEBABqAjTy1+BxfmWCP9X7xW15nVfkKBRuKpF29CTkleYijASKH9OxzLXl/N/hYtCvPL+OiqqS5108uU8UrI8XcUwcnChx0JwAAAAAg36FRYdZwIGrtB39z4+nD20ygPmM5lEGhH56hzDfpxv0agI08tfgcX5lgj/V+8VteZ1X5CgUbiqRdvQk5JXmIo+gDAAAAAAAAQKs8AAAAAAAA";
const SENDER = "0x1a808d3cb5f81c5f99608ff57ef15b5e6755f90a051b8aa45dbd0939257988a3";
const API_KEY = "us1_sui_testnet_eb7f095ed2d649fab90d6bc0b9a70fc2";
const ENDPOINT = "https://api.us1.shinami.com/gas/v1";

async function testFormat1() {
  console.log('\n📋 Test 1: params as array [txBytes, sender]');
  try {
    const response = await axios.post(
      ENDPOINT,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'gas_sponsorTransactionBlock',
        params: [TX_BYTES, SENDER],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
      }
    );
    console.log('✅ Success!', response.data);
  } catch (error: any) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

async function testFormat2() {
  console.log('\n📋 Test 2: params as object {txBytes, sender}');
  try {
    const response = await axios.post(
      ENDPOINT,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'gas_sponsorTransactionBlock',
        params: { txBytes: TX_BYTES, sender: SENDER },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
      }
    );
    console.log('✅ Success!', response.data);
  } catch (error: any) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

async function testFormat3() {
  console.log('\n📋 Test 3: params with gasBudget');
  try {
    const response = await axios.post(
      ENDPOINT,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'gas_sponsorTransactionBlock',
        params: [TX_BYTES, SENDER, 100000000],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
      }
    );
    console.log('✅ Success!', response.data);
  } catch (error: any) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

async function testFormat4() {
  console.log('\n📋 Test 4: Different method name?');
  try {
    const response = await axios.post(
      ENDPOINT,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'gas_sponsorTransaction',
        params: [TX_BYTES, SENDER],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
      }
    );
    console.log('✅ Success!', response.data);
  } catch (error: any) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing different Shinami API parameter formats...\n');
  
  await testFormat1();
  await testFormat2();
  await testFormat3();
  await testFormat4();
  
  console.log('\n✅ Tests complete\n');
}

runTests().catch(console.error);
