import { getOAuthAccessToken } from './lib/oauth-helper.js';

const scriptId = 'YOUR_SCRIPT_ID_HERE';

async function createWebAppWithEntryPoint() {
  try {
    const token = await getOAuthAccessToken();
    
    console.log('Creating web app deployment with entry point...');
    
    // Create deployment with web app entry point configuration
    const deploymentConfig = {
      description: "Hello World Web App - Anyone Access",
      manifestFileName: "appsscript",
      versionNumber: 4,
      entryPoints: [
        {
          entryPointType: "WEB_APP",
          webApp: {
            access: "ANYONE",
            executeAs: "USER_ACCESSING"
          }
        }
      ]
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
      console.log('\n🎉 SUCCESS! Your web app is now deployed and accessible!');
      console.log('Web App URL:', data.entryPoints[0].webApp.url);
      console.log('Access Level:', data.entryPoints[0].webApp.access);
      console.log('Execute As:', data.entryPoints[0].webApp.executeAs);
      console.log('\n📱 You can now access your Hello World app at the URL above!');
    }
    
    return data;
  } catch (error) {
    console.error('Error creating web app:', error);
    return null;
  }
}

async function main() {
  console.log('=== Google Apps Script Web App Deployment ===\n');
  console.log('Creating a deployment configured as a web app...\n');
  
  await createWebAppWithEntryPoint();
}

main().catch(console.error);
