import { getOAuthAccessToken } from './lib/oauth-helper.js';

const scriptId = 'YOUR_SCRIPT_ID_HERE';

async function createWebAppDeployment() {
  try {
    const token = await getOAuthAccessToken();
    
    console.log('Creating web app deployment...');
    
    // The correct format for creating a web app deployment
    const deploymentConfig = {
      description: "Hello World Web App - Public Access",
      manifestFileName: "appsscript",
      versionNumber: 4
    };

    console.log('Deployment config:', JSON.stringify(deploymentConfig, null, 2));

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
    console.log('Deployment created:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error creating deployment:', error);
    return null;
  }
}

async function getDeploymentDetails(deploymentId) {
  try {
    const token = await getOAuthAccessToken();
    
    console.log(`Getting details for deployment: ${deploymentId}`);
    
    const response = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments/${deploymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Deployment details:', JSON.stringify(data, null, 2));
    
    if (data.entryPoints && data.entryPoints[0] && data.entryPoints[0].webApp) {
      console.log('\n🎉 SUCCESS! Your web app is deployed!');
      console.log('Web App URL:', data.entryPoints[0].webApp.url);
      console.log('Access Level:', data.entryPoints[0].webApp.access);
      console.log('Execute As:', data.entryPoints[0].webApp.executeAs);
    } else {
      console.log('\n⚠️  This deployment doesn\'t seem to be configured as a web app yet.');
      console.log('You may need to manually configure it in the Google Apps Script editor.');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting deployment details:', error);
    return null;
  }
}

async function main() {
  console.log('=== Google Apps Script Web App Deployment ===\n');
  
  // Check existing deployments first
  console.log('Checking existing deployments...');
  
  // Check the latest deployment we created
  const existingDeploymentId = 'YOUR_DEPLOYMENT_ID_HERE';
  const existingDeployment = await getDeploymentDetails(existingDeploymentId);
  
  if (existingDeployment && existingDeployment.entryPoints && existingDeployment.entryPoints[0] && existingDeployment.entryPoints[0].webApp) {
    console.log('✅ Existing deployment is already configured as a web app!');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Create a new deployment
  const newDeployment = await createWebAppDeployment();
  
  if (newDeployment && newDeployment.deploymentId) {
    console.log('\n' + '='.repeat(50) + '\n');
    await getDeploymentDetails(newDeployment.deploymentId);
  }
}

main().catch(console.error);
