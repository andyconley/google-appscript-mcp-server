// Test script to verify MCP deployment creation works
import { apiTool } from './tools/google-app-script-api/apps-script-api/script-projects-deployments-create.js';

const scriptId = 'YOUR_SCRIPT_ID_HERE';

async function testDeploymentCreation() {
  console.log('🧪 Testing MCP deployment creation...');
  
  try {
    const result = await apiTool.function({
      scriptId: scriptId,
      manifestFileName: 'appsscript',
      versionNumber: 1,
      description: 'Test deployment via MCP tools'
    });
    
    console.log('✅ Deployment creation result:', JSON.stringify(result, null, 2));
    
    if (result.deploymentId) {
      console.log('🎉 Deployment created successfully!');
      console.log(`📱 Deployment ID: ${result.deploymentId}`);
      if (result.entryPoints && result.entryPoints.length > 0) {
        const webAppEntry = result.entryPoints.find(entry => entry.entryPointType === 'WEB_APP');
        if (webAppEntry) {
          console.log(`🌐 Web App URL: ${webAppEntry.webApp.url}`);
        }
      }
    } else {
      console.log('❌ Deployment creation failed:', result);
    }
    
  } catch (error) {
    console.error('💥 Error during deployment creation:', error);
  }
}

testDeploymentCreation();
