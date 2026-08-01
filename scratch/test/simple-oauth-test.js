#!/usr/bin/env node

/**
 * Simple OAuth Setup Test
 */

console.log('🔐 OAuth Setup Test');
console.log('==================');

// Test without any imports first
console.log('✅ Console output working');

try {
  console.log('📦 Testing imports...');
  
  // Test basic import
  const { TokenManager } = await import('../lib/tokenManager.js');
  console.log('✅ TokenManager imported successfully');
  
  const tokenManager = new TokenManager();
  console.log('✅ TokenManager instance created');
  
  const tokenInfo = tokenManager.getTokenInfo();
  console.log('📊 Token info:', tokenInfo);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
