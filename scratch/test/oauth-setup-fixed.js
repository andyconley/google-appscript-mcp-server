#!/usr/bin/env node

/**
 * OAuth Setup Script for Google Apps Script API
 * This script helps you obtain and securely store OAuth tokens
 */

import 'dotenv/config';
import { manualOAuthFlow } from '../lib/oauth-helper.js';
import { TokenManager } from '../lib/tokenManager.js';
import { readFileSync } from 'fs';

console.log('🔐 Google Apps Script API OAuth Setup');
console.log('=====================================\n');

async function setupOAuth() {
  console.log('📋 This script will help you set up OAuth authentication for Google Apps Script API.');
  console.log('📝 You need to have your CLIENT_ID and CLIENT_SECRET configured in .env file.\n');
  
  const tokenManager = new TokenManager();
  
  // Handle info command
  if (process.argv.includes('--info')) {
    const tokenInfo = tokenManager.getTokenInfo();
    
    console.log('🔍 Token Information:');
    console.log('=====================\n');
    
    if (tokenInfo.hasTokens) {
      console.log('✅ Tokens found');
      console.log(`📁 Location: ${tokenInfo.location}`);
      console.log(`💾 Saved at: ${tokenInfo.savedAt}`);
      console.log(`⏰ Expires at: ${tokenInfo.expiresAt}`);
      console.log(`📊 Status: ${tokenInfo.status}`);
      console.log(`🔐 Scope: ${tokenInfo.scope || 'Not specified'}`);
    } else {
      console.log('❌ No tokens found');
      console.log(`📁 Expected location: ${tokenInfo.location}`);
      console.log('\n💡 Run "node oauth-setup.js" to set up OAuth tokens');
    }
    
    process.exit(0);
  }
  
  // Handle clear command
  if (process.argv.includes('--clear')) {
    tokenManager.clearTokens();
    console.log('✅ Tokens cleared successfully.');
    process.exit(0);
  }
  
  // Check if tokens already exist
  const tokenInfo = tokenManager.getTokenInfo();
  if (tokenInfo.hasTokens) {
    console.log('🔍 Found existing tokens:');
    console.log(`   📁 Location: ${tokenInfo.location}`);
    console.log(`   💾 Saved at: ${tokenInfo.savedAt}`);
    console.log(`   ⏰ Expires at: ${tokenInfo.expiresAt}`);
    console.log(`   📊 Status: ${tokenInfo.status}`);
    console.log(`   🔐 Scope: ${tokenInfo.scope || 'Not specified'}\n`);
    
    if (!tokenInfo.isExpired) {
      console.log('✅ You already have valid tokens stored.');
      console.log('💡 To get new tokens, run: node oauth-setup.js --force');
      console.log('🗑️ To clear existing tokens, run: node oauth-setup.js --clear\n');
      
      if (!process.argv.includes('--force')) {
        process.exit(0);
      }
    }
  }
  
  try {
    // Check if .env file exists and has required credentials
    const envPath = '.env';
    let envContent = '';
    
    try {
      envContent = readFileSync(envPath, 'utf8');
      console.log('✅ Found .env file');
    } catch (error) {
      console.error('❌ No .env file found. Please create one first with your CLIENT_ID and CLIENT_SECRET.');
      console.log('\n📝 Example .env file content:');
      console.log('GOOGLE_APP_SCRIPT_API_CLIENT_ID=your_client_id_here');
      console.log('GOOGLE_APP_SCRIPT_API_CLIENT_SECRET=your_client_secret_here');
      console.log('\n📖 Note: Refresh token is now stored securely and not needed in .env file');
      process.exit(1);
    }
    
    // Check for required credentials
    const hasClientId = envContent.includes('GOOGLE_APP_SCRIPT_API_CLIENT_ID=') && 
                       !envContent.includes('GOOGLE_APP_SCRIPT_API_CLIENT_ID=your_client_id_here');
    const hasClientSecret = envContent.includes('GOOGLE_APP_SCRIPT_API_CLIENT_SECRET=') && 
                           !envContent.includes('GOOGLE_APP_SCRIPT_API_CLIENT_SECRET=your_client_secret_here');
    
    if (!hasClientId || !hasClientSecret) {
      console.error('❌ Missing CLIENT_ID or CLIENT_SECRET in .env file.');
      console.log('\n🔧 Please update your .env file with valid credentials:');
      console.log('   - GOOGLE_APP_SCRIPT_API_CLIENT_ID=your_actual_client_id');
      console.log('   - GOOGLE_APP_SCRIPT_API_CLIENT_SECRET=your_actual_client_secret');
      console.log('\n📖 See OAUTH_SETUP.md for instructions on obtaining these credentials.');
      process.exit(1);
    }
    
    console.log('✅ Found required credentials in .env file');
    console.log('\n🚀 Starting OAuth flow...');
    console.log('📱 Your browser will open automatically');
    console.log('🔐 Please authorize the application when prompted');
    console.log('⏳ Waiting for authorization...\n');
    
    // Start OAuth flow
    const tokens = await manualOAuthFlow();
    
    if (tokens.refresh_token) {
      console.log('\n🎉 OAuth setup successful!');
      console.log('🔑 Access token obtained:', tokens.access_token ? '✅' : '❌');
      console.log('🔄 Refresh token obtained:', tokens.refresh_token ? '✅' : '❌');
      
      // Save tokens securely using TokenManager
      try {
        tokenManager.saveTokens(tokens);
        console.log('💾 Tokens saved securely');
        
        const tokenInfo = tokenManager.getTokenInfo();
        console.log(`📁 Token location: ${tokenInfo.location}`);
        console.log(`🔒 File permissions: Owner read/write only`);
        
        console.log('\n✅ Setup complete! Your OAuth tokens are now stored securely.');
        console.log('🔐 Refresh tokens are stored in a secure OS-specific location');
        console.log('🚀 You can now use the MCP server and API tools');
        
        console.log('\n🧪 Test your setup with:');
        console.log('   node test-token-management.js');
        
      } catch (saveError) {
        console.error('\n❌ Failed to save tokens:', saveError.message);
        console.log('🔧 Please check file permissions and try again');
        process.exit(1);
      }
      
    } else {
      console.log('\n⚠️ OAuth completed but no refresh token received.');
      console.log('🔄 You may need to revoke and re-authorize the application.');
      console.log('📖 Check the Google Cloud Console for your OAuth settings.');
    }
    
  } catch (error) {
    console.error('\n❌ OAuth setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify your CLIENT_ID and CLIENT_SECRET are correct');
    console.log('   3. Ensure the redirect URI is registered in Google Cloud Console');
    console.log('   4. Make sure Google Apps Script API is enabled');
    console.log('   5. Try revoking and re-creating your OAuth credentials');
    console.log('\n📖 For detailed setup instructions, see OAUTH_SETUP.md');
    process.exit(1);
  }
}

// Run setup
setupOAuth().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
