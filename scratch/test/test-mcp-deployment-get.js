// Test script to verify MCP deployment get works
import { apiTool } from './tools/google-app-script-api/apps-script-api/script-projects-deployments-get.js';

const scriptId = 'YOUR_SCRIPT_ID_HERE';
const deploymentId = 'YOUR_DEPLOYMENT_ID_HERE'; // From previous test

async function testDeploymentGet() {
  console.log('🧪 Testing MCP deployment get...');
  
  try {
    const result = await apiTool.function({
      scriptId: scriptId,
      deploymentId: deploymentId
    });
    
    console.log('✅ Deployment get result:', JSON.stringify(result, null, 2));
    
    if (result.deploymentId) {
      console.log('🎉 Deployment retrieved successfully!');
      console.log(`📱 Deployment ID: ${result.deploymentId}`);
      
      if (result.entryPoints && result.entryPoints.length > 0) {
        console.log('🔗 Entry Points:');
        result.entryPoints.forEach((entryPoint, index) => {
          console.log(`  ${index + 1}. Type: ${entryPoint.entryPointType}`);
          if (entryPoint.webApp) {
            console.log(`     🌐 Web App URL: ${entryPoint.webApp.url}`);
            console.log(`     🔒 Access: ${entryPoint.webApp.access}`);
            console.log(`     👤 Execute As: ${entryPoint.webApp.executeAs}`);
          }
        });
      } else {
        console.log('⚠️ No entry points found in deployment');
      }
    } else {
      console.log('❌ Deployment retrieval failed:', result);
    }
    
  } catch (error) {
    console.error('💥 Error during deployment get:', error);
  }
}

testDeploymentGet();
