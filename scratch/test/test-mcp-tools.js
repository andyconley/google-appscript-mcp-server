#!/usr/bin/env node

/**
 * Test script to verify MCP tools work with automatic OAuth
 */

import 'dotenv/config';
import { getAuthHeaders } from './lib/oauth-helper.js';

// Test the script-projects-get tool
async function testScriptProjectGet() {
  console.log('🧪 Testing script-projects-get tool...');
  
  try {
    // Import the tool
    const { apiTool } = await import('./tools/google-app-script-api/apps-script-api/script-projects-get.js');
    
    // Test with a sample script ID (this will likely fail but should show detailed error info)
    const testScriptId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'; // Sample ID
    
    console.log('📋 Testing with script ID:', testScriptId);
    console.log('🔄 Calling tool function...');
    
    const result = await apiTool.function({ scriptId: testScriptId });
    
    console.log('✅ Tool result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Test OAuth headers directly
async function testOAuthHeaders() {
  console.log('\n🧪 Testing OAuth headers directly...');
  
  try {
    const headers = await getAuthHeaders();
    console.log('✅ OAuth headers obtained successfully');
    console.log('🔐 Authorization header length:', headers.Authorization?.length || 0);
    
    return true;
  } catch (error) {
    console.error('❌ OAuth error:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting MCP Tool Tests...');
  console.log('=====================================');
  
  // Test OAuth headers first
  const oauthWorking = await testOAuthHeaders();
  
  if (!oauthWorking) {
    console.log('❌ OAuth not working, skipping tool test');
    return;
  }
  
  // Test the actual tool
  await testScriptProjectGet();
  
  console.log('\n🎉 Tests completed!');
}

runTests().catch(console.error);
