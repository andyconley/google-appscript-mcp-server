#!/usr/bin/env node

/**
 * Test script to verify OAuth authentication setup
 */

import 'dotenv/config';
import { getOAuthAccessToken, getAuthHeaders } from './lib/oauth-helper.js';

async function testOAuthAuthentication() {
  console.log('🔐 Testing OAuth Authentication for Google Apps Script API...\n');
  console.log('🕐 Test started at:', new Date().toISOString());
  console.log('📂 Working directory:', process.cwd());
  console.log('🔧 Node.js version:', process.version);
  console.log('');
  
  try {
    // Test 1: Get access token
    console.log('📋 Step 1: Getting OAuth access token...');
    console.log('⏳ Attempting to retrieve access token from OAuth helper...');
    
    const startTime = Date.now();
    const accessToken = await getOAuthAccessToken();
    const duration = Date.now() - startTime;
    
    console.log('✅ Successfully obtained access token:', accessToken.substring(0, 20) + '...');
    console.log('⏱️  Token retrieval took:', duration + 'ms');
    console.log('📏 Full token length:', accessToken.length, 'characters');
    console.log('');
    
    // Test 2: Get auth headers
    console.log('📋 Step 2: Creating authorization headers...');
    console.log('⏳ Building authorization headers for API requests...');
    
    const headerStartTime = Date.now();
    const headers = await getAuthHeaders();
    const headerDuration = Date.now() - headerStartTime;
    
    console.log('✅ Successfully created auth headers:', JSON.stringify(headers, null, 2));
    console.log('⏱️  Header creation took:', headerDuration + 'ms');
    console.log('📊 Header keys count:', Object.keys(headers).length);
    console.log('');
    
    // Test 3: Test API call (optional - requires valid script ID)
    console.log('📋 Step 3: Testing API connectivity...');
    console.log('ℹ️  To test a full API call, you would need a valid script ID.');
    console.log('ℹ️  You can test with the script_processes_list tool in your MCP client.\n');
    
    const totalDuration = Date.now() - startTime;
    console.log('🎉 OAuth authentication test completed successfully!');
    console.log('✅ Your OAuth setup is working correctly.');
    console.log('⏱️  Total test duration:', totalDuration + 'ms');
    console.log('🕐 Test completed at:', new Date().toISOString());
    console.log('');
    
    console.log('📝 Next steps:');
    console.log('1. Test one of the tools in your MCP client (Claude Desktop, Postman, etc.)');
    console.log('2. Use a valid Google Apps Script project ID when calling the tools');
    console.log('3. Ensure your OAuth token has the required scopes for the operations you want to perform');
    
  } catch (error) {
    console.error('❌ OAuth authentication failed!');
    console.error('🕐 Error occurred at:', new Date().toISOString());
    console.error('');
    
    // Detailed error logging
    console.error('📋 Error Details:');
    console.error('  📄 Message:', error.message);
    console.error('  🏷️  Name:', error.name);
    console.error('  📊 Stack trace:');
    if (error.stack) {
      console.error(error.stack.split('\n').map(line => '    ' + line).join('\n'));
    } else {
      console.error('    (No stack trace available)');
    }
    console.error('');
    
    // Additional error information
    if (error.code) {
      console.error('  🔢 Error code:', error.code);
    }
    if (error.status) {
      console.error('  📊 HTTP status:', error.status);
    }
    if (error.statusText) {
      console.error('  📝 Status text:', error.statusText);
    }
    if (error.response) {
      console.error('  📬 Response data:', JSON.stringify(error.response, null, 2));
    }
    console.error('');
    
    // Environment check
    console.log('🔍 Environment Check:');
    console.log('  📂 Current directory:', process.cwd());
    console.log('  🔧 Node.js version:', process.version);
    console.log('  💾 Platform:', process.platform);
    console.log('  🏗️  Architecture:', process.arch);
    
    // Check for .env file
    try {
      const fs = await import('fs');
      const envPath = '.env';
      const envExists = fs.existsSync(envPath);
      console.log('  📄 .env file exists:', envExists);
      
      if (envExists) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        console.log('  📋 .env file lines count:', envLines.length);
          // Check for required OAuth variables (without showing values)
        const requiredVars = ['GOOGLE_APP_SCRIPT_API_CLIENT_ID', 'GOOGLE_APP_SCRIPT_API_CLIENT_SECRET', 'GOOGLE_APP_SCRIPT_API_REFRESH_TOKEN'];
        requiredVars.forEach(varName => {
          const hasVar = envContent.includes(varName + '=');
          console.log(`  🔑 ${varName} present:`, hasVar);
        });
      }
    } catch (fsError) {
      console.log('  ⚠️  Could not check .env file:', fsError.message);
    }
    console.log('');
    
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Check that your .env file contains valid OAuth credentials');
    console.log('2. Verify your client ID and client secret are correct');
    console.log('3. Ensure your refresh token is valid and not expired');
    console.log('4. Follow the OAUTH_SETUP.md guide to obtain new credentials if needed');
    console.log('5. Make sure the Google Apps Script API is enabled in your GCP project');
    console.log('6. Check your internet connection and firewall settings');
    console.log('7. Verify that the oauth-helper.js file exists and is accessible');
    
    process.exit(1);
  }
}

// Run the test if this script is executed directly
console.log('🔍 Debug: process.argv[1]:', process.argv[1]);
console.log('🔍 Debug: endsWith check:', process.argv[1] && process.argv[1].endsWith('test-oauth.js'));

if (process.argv[1] && process.argv[1].endsWith('test-oauth.js')) {
  console.log('🚀 Starting OAuth test...');
  testOAuthAuthentication();
} else {
  console.log('❌ Script not executed directly, skipping test');
}
