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
  
  // Handle clear command
  if (process.argv.includes('--clear')) {
    tokenManager.clearTokens();
    console.log('✅ Tokens cleared successfully.');
    process.exit(0);
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
    
    console.log('✅ Found required credentials in .env file');    console.log('\n🚀 Starting OAuth flow...');
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
        
      } catch (error) {
        console.error('❌ Failed to save tokens:', error.message);
        console.log('\n📝 Please run the setup again or contact support.');
        process.exit(1);
      }
      
      console.log('\n📋 Setup Summary:');
      console.log('   ✅ OAuth flow completed');
      console.log('   ✅ Access token obtained');
      console.log('   ✅ Refresh token obtained');
      console.log('   ✅ Tokens stored securely');
      console.log('\n🔐 Security Notes:');
      console.log('   🔒 Refresh token is stored with restricted file permissions');
      console.log('   ⏰ Access token will be refreshed automatically');
      console.log('   🚫 No sensitive tokens are stored in .env file');
      console.log('\n🎯 Next Steps:');
      console.log('   1. Test the OAuth setup: npm run test-oauth');
      console.log('   2. Configure your MCP client (Claude Desktop, VS Code, etc.)');
      console.log('   3. Use your MCP tools with confidence!');
      
    } else {
      console.error('\n❌ OAuth setup failed: No refresh token received');
      console.log('🔧 This might happen if:');
      console.log('   - Your OAuth app is not configured correctly');
      console.log('   - You denied the authorization request');
      console.log('   - There was a network error during the process');
      console.log('\n📖 Please check the OAUTH_SETUP.md guide and try again.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ OAuth setup failed:', error.message);
    
    if (error.message.includes('EADDRINUSE')) {
      console.log('\n🔧 Port already in use. Please:');
      console.log('   1. Close any other applications using port 3001');
      console.log('   2. Wait a moment and try again');
    } else if (error.message.includes('CLIENT_ID') || error.message.includes('CLIENT_SECRET')) {
      console.log('\n🔧 OAuth credential issue. Please:');
      console.log('   1. Check your .env file has correct credentials');
      console.log('   2. Verify credentials in Google Cloud Console');
      console.log('   3. Make sure OAuth consent screen is configured');
    } else {
      console.log('\n🔧 Please check:');
      console.log('   1. Your internet connection');
      console.log('   2. Google Cloud Console OAuth configuration');
      console.log('   3. That you authorized the application in the browser');
    }
    
    console.log('\n📖 For detailed setup instructions, see OAUTH_SETUP.md');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('📖 Google Apps Script OAuth Setup');
  console.log('\nUsage:');
  console.log('  node oauth-setup.js           # Run OAuth setup');
  console.log('  node oauth-setup.js --force   # Force new OAuth setup (overwrite existing tokens)');
  console.log('  node oauth-setup.js --clear   # Clear stored tokens');
  console.log('  node oauth-setup.js --info    # Show token information');
  console.log('  node oauth-setup.js --help    # Show this help');
  process.exit(0);
}

if (process.argv.includes('--info')) {
  const tokenManager = new TokenManager();
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

// Run setup
setupOAuth().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
      
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

// Run setup if this script is executed directly
console.log('🔍 Debug: process.argv[1]:', process.argv[1]);
console.log('🔍 Debug: endsWith check:', process.argv[1] && process.argv[1].endsWith('oauth-setup.js'));

if (process.argv[1] && process.argv[1].endsWith('oauth-setup.js')) {
  console.log('🚀 Starting OAuth setup...');
  setupOAuth();
} else {
  console.log('❌ Script not executed directly, skipping setup');
}
