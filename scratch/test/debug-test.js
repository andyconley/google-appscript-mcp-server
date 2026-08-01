console.log('🔍 Debug: Script starting...');

import 'dotenv/config';
console.log('🔍 Debug: Dotenv loaded');

import { TokenManager } from './lib/tokenManager.js';
console.log('🔍 Debug: TokenManager imported');

const tokenManager = new TokenManager();
console.log('🔍 Debug: TokenManager instantiated');

const tokenInfo = tokenManager.getTokenInfo();
console.log('🔍 Debug: TokenInfo obtained:', tokenInfo);

console.log('🔍 Debug: Script completed successfully');
