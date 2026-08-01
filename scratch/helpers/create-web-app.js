import { getOAuthAccessToken } from './lib/oauth-helper.js';

const scriptId = 'YOUR_SCRIPT_ID_HERE';

async function listDeployments() {
  try {
    const token = await getOAuthAccessToken();
    
    console.log('Fetching current deployments...');
    const response = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments`, {
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
    console.log('Current deployments:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error listing deployments:', error);
    return null;
  }
}

async function createWebApp() {
  try {
    const token = await getOAuthAccessToken();
    
    console.log('Creating web app deployment...');
    
    const deploymentConfig = {
      description: "Hello World Web App - Public Access",
      manifestFileName: "appsscript.json",
      versionNumber: 4, // Using the latest version we created
      accessConfig: {
        access: "ANYONE",
        executeAs: "USER_ACCESSING"
      }
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
    console.log('Web app deployment created:', JSON.stringify(data, null, 2));
    
    if (data.entryPoints && data.entryPoints[0] && data.entryPoints[0].webApp) {
      console.log('\n🎉 SUCCESS! Your web app is now deployed!');
      console.log('Web App URL:', data.entryPoints[0].webApp.url);
      console.log('Access Level:', data.entryPoints[0].webApp.access);
      console.log('Execute As:', data.entryPoints[0].webApp.executeAs);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating web app:', error);
    return null;
  }
}

async function main() {
  console.log('=== Google Apps Script Web App Deployment ===\n');
  
  // First list current deployments
  await listDeployments();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Then create the web app
  await createWebApp();
}

main().catch(console.error);
