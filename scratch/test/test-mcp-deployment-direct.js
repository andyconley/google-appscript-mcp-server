#!/usr/bin/env node

/**
 * Test MCP deployment creation using the same approach as deploy-complete-webapp.js
 */

import { getOAuthAccessToken } from './lib/oauth-helper.js';

const scriptId = 'YOUR_SCRIPT_ID_HERE';

async function createVersionWithMCPApproach() {
  try {
    const token = await getOAuthAccessToken();
    
    console.log('Creating new version using MCP approach...');
    
    const versionData = {
      description: "New version for MCP deployment test"
    };

    const response = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/versions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(versionData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ New version created:', data.versionNumber);
    
    return data;
  } catch (error) {
    console.error('Error creating version:', error);
    return null;
  }
}

async function createDeploymentWithMCPApproach(versionNumber) {
  try {
    const token = await getOAuthAccessToken();
    
    console.log('Creating deployment using MCP approach...');
    
    const deploymentConfig = {
      description: "MCP Test Web App - Public Access",
      manifestFileName: "appsscript",
      versionNumber: versionNumber
    };

    const response = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(deploymentConfig)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Deployment created:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error creating deployment:', error);
    return null;
  }
}

async function testMCPDeployment() {
  console.log('=== Testing MCP Deployment Approach ===\n');
  
  // Step 1: Create a new version
  console.log('Step 1: Creating a new version...');
  const versionResult = await createVersionWithMCPApproach();
  if (!versionResult) return;
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 2: Create deployment with the new version
  console.log('Step 2: Creating deployment...');
  const deploymentResult = await createDeploymentWithMCPApproach(versionResult.versionNumber);
  if (!deploymentResult) return;
  
  // Show web app URL if available
  if (deploymentResult.entryPoints && deploymentResult.entryPoints[0] && deploymentResult.entryPoints[0].webApp) {
    console.log('\n🎉 SUCCESS! Web app deployed via MCP approach!');
    console.log('Web App URL:', deploymentResult.entryPoints[0].webApp.url);
  }
}

testMCPDeployment().catch(console.error);
