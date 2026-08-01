#!/usr/bin/env node

/**
 * Test OAuth Token Management System
 * This script tests the secure token storage and refresh functionality
 */

import 'dotenv/config';
import { TokenManager } from './lib/tokenManager.js';
import { getOAuthAccessToken, hasValidTokens, getTokenInfo } from './lib/oauth-helper.js';

console.log('🧪 Testing OAuth Token Management System');
console.log('=========================================\n');

async function testTokenManagement() {
  try {
    console.log('1. 🔍 Checking environment variables...');
    const clientId = process.env.GOOGLE_APP_SCRIPT_API_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_APP_SCRIPT_API_CLIENT_SECRET;
    
    console.log('   - CLIENT_ID exists:', !!clientId);
    console.log('   - CLIENT_SECRET exists:', !!clientSecret);
    
    if (!clientId || !clientSecret) {
      console.error('\n❌ Missing OAuth credentials in .env file');
      console.log('💡 Please update your .env file with:');
      console.log('   - GOOGLE_APP_SCRIPT_API_CLIENT_ID=your_client_id');
      console.log('   - GOOGLE_APP_SCRIPT_API_CLIENT_SECRET=your_client_secret');
      process.exit(1);
    }
    
    console.log('\n2. 📁 Checking token storage...');
    const tokenManager = new TokenManager();
    const tokenInfo = tokenManager.getTokenInfo();
    
    if (tokenInfo.hasTokens) {
      console.log('   ✅ Tokens found');
      console.log(`   📁 Location: ${tokenInfo.location}`);
      console.log(`   💾 Saved at: ${tokenInfo.savedAt}`);
      console.log(`   ⏰ Expires at: ${tokenInfo.expiresAt}`);
      console.log(`   📊 Status: ${tokenInfo.status}`);
      console.log(`   🔐 Scope: ${tokenInfo.scope || 'Not specified'}`);
    } else {
      console.log('   ❌ No tokens found');
      console.log(`   📁 Expected location: ${tokenInfo.location}`);
      console.log('\n💡 Run "node oauth-setup.js" to set up OAuth tokens');
      process.exit(0);
    }
    
    console.log('\n3. 🔐 Testing token validity...');
    const hasTokens = hasValidTokens();
    console.log('   - Has valid tokens:', hasTokens);
    
    if (hasTokens) {
      console.log('\n4. 🔄 Testing access token retrieval...');
      try {
        const accessToken = await getOAuthAccessToken();
        console.log('   ✅ Access token obtained successfully');
        console.log('   🔑 Token preview:', accessToken.substring(0, 20) + '...');
        
        console.log('\n5. ✅ All tests passed!');
        console.log('   🎯 Your OAuth token management is working correctly');
        
      } catch (error) {
        console.error('\n❌ Failed to get access token:', error.message);
        
        if (error.message.includes('Token refresh failed')) {
          console.log('\n💡 This might happen if:');
          console.log('   - Your OAuth credentials have been revoked');
          console.log('   - Your client secret has changed');
          console.log('   - There are network connectivity issues');
          console.log('\n🔧 Try running: node oauth-setup.js --force');
        }
      }
    } else {
      console.log('\n❌ No valid tokens available');
      console.log('💡 Run "node oauth-setup.js" to set up OAuth tokens');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    process.exit(1);
  }
}

// Command line help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('📖 OAuth Token Management Test');
  console.log('\nUsage:');
  console.log('  node test-token-management.js        # Run all tests');
  console.log('  node test-token-management.js --help # Show this help');
  console.log('\nThis script tests:');
  console.log('  - Environment variable configuration');
  console.log('  - Token storage and retrieval');
  console.log('  - Access token refresh functionality');
  console.log('  - Overall OAuth system health');
  process.exit(0);
}

testTokenManagement().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
