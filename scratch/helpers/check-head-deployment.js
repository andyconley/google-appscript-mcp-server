#!/usr/bin/env node

import { getOAuthAccessToken } from './lib/oauth-helper.js';

async function checkHeadDeployment() {
  const scriptId = 'YOUR_SCRIPT_ID_HERE';
  
  try {
    console.log('🔐 Getting OAuth token...');
    const token = await getOAuthAccessToken();
    
    console.log('📋 Checking HEAD deployment...');
    const deployResponse = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments/HEAD`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!deployResponse.ok) {
      const error = await deployResponse.text();
      console.error('❌ HEAD deployment error:', error);
      return;
    }
    
    const deployment = await deployResponse.json();
    console.log('✅ HEAD deployment:', JSON.stringify(deployment, null, 2));
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkHeadDeployment();
