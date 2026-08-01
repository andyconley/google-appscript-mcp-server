// Complete test script to create a web app deployment using MCP tools
import { apiTool as updateContentTool } from './tools/google-app-script-api/apps-script-api/script-projects-update-content.js';
import { apiTool as createVersionTool } from './tools/google-app-script-api/apps-script-api/script-projects-versions-create.js';
import { apiTool as createDeploymentTool } from './tools/google-app-script-api/apps-script-api/script-projects-deployments-create.js';
import { apiTool as getDeploymentTool } from './tools/google-app-script-api/apps-script-api/script-projects-deployments-get.js';

const scriptId = 'YOUR_SCRIPT_ID_HERE';

async function createCompleteWebAppViaMCP() {
  console.log('🚀 Creating complete web app deployment via MCP tools...');
  
  try {
    // Step 1: Update script content with webapp configuration
    console.log('\n📝 Step 1: Updating script content with webapp configuration...');
    
    const updatedManifest = {
      "timeZone": "America/New_York",
      "dependencies": {},
      "exceptionLogging": "STACKDRIVER", 
      "runtimeVersion": "V8",
      "webapp": {
        "access": "ANYONE",
        "executeAs": "USER_ACCESSING"
      }
    };

    const scriptContent = {
      files: [
        {
          name: "appsscript",
          type: "JSON",
          source: JSON.stringify(updatedManifest, null, 2)
        },
        {
          name: "code",
          type: "SERVER_JS",
          source: `/**
 * Serves the HTML page when the web app is accessed
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Hello World App via MCP')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Server-side function that can be called from the client
 */
function getGreeting(name) {
  if (!name) {
    name = 'World';
  }
  return \`Hello, \${name}! This web app was created via MCP tools.\`;
}

/**
 * Get current time
 */
function getCurrentTime() {
  return new Date().toLocaleString();
}`
        },
        {
          name: "index",
          type: "HTML",
          source: `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <title>Hello World App via MCP</title>
  <style>
    body {
      font-family: 'Google Sans', Roboto, Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    .container {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 30px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }
    h1 {
      color: #fff;
      margin-bottom: 30px;
      font-size: 2.5em;
    }
    input {
      padding: 12px;
      margin: 10px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      width: 250px;
    }
    button {
      background: #4285f4;
      color: white;
      border: none;
      padding: 12px 24px;
      margin: 10px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.3s;
    }
    button:hover {
      background: #3367d6;
    }
    .result {
      margin-top: 20px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      min-height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .loading {
      display: none;
      color: #ffd700;
    }
    .timestamp {
      margin-top: 10px;
      font-size: 0.9em;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌟 Hello World App via MCP 🌟</h1>
    <p>This web app was created using MCP (Model Context Protocol) tools!</p>
    
    <div class="input-group">
      <input type="text" id="nameInput" placeholder="Enter your name (optional)" />
    </div>
    
    <div>
      <button onclick="sayHello()">Say Hello</button>
      <button onclick="getTime()">Get Current Time</button>
    </div>
    
    <div id="result" class="result">
      Click a button to see the MCP magic! ✨
    </div>
    
    <div id="loading" class="loading">Loading...</div>
    
    <div id="timestamp" class="timestamp"></div>
  </div>

  <script>
    function sayHello() {
      showLoading();
      const name = document.getElementById('nameInput').value;
      
      google.script.run
        .withSuccessHandler(onSuccess)
        .withFailureHandler(onFailure)
        .getGreeting(name);
    }
    
    function getTime() {
      showLoading();
      
      google.script.run
        .withSuccessHandler(onTimeSuccess)
        .withFailureHandler(onFailure)
        .getCurrentTime();
    }
    
    function onSuccess(result) {
      hideLoading();
      document.getElementById('result').innerHTML = \`
        <div style="font-size: 20px; font-weight: bold;">
          \${result}
        </div>
      \`;
      updateTimestamp();
    }
    
    function onTimeSuccess(result) {
      hideLoading();
      document.getElementById('result').innerHTML = \`
        <div style="font-size: 18px;">
          🕒 Current Time: <strong>\${result}</strong>
        </div>
      \`;
      updateTimestamp();
    }
    
    function onFailure(error) {
      hideLoading();
      document.getElementById('result').innerHTML = \`
        <div style="color: #ff6b6b;">
          ❌ Error: \${error.message || 'Something went wrong!'}
        </div>
      \`;
      updateTimestamp();
    }
    
    function showLoading() {
      document.getElementById('loading').style.display = 'block';
      document.getElementById('result').style.display = 'none';
    }
    
    function hideLoading() {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('result').style.display = 'flex';
    }
    
    function updateTimestamp() {
      document.getElementById('timestamp').textContent = 
        'Last updated: ' + new Date().toLocaleTimeString();
    }
    
    // Initial timestamp
    updateTimestamp();
  </script>
</body>
</html>`
        }
      ]
    };

    const updateResult = await updateContentTool.function({
      scriptId: scriptId,
      files: scriptContent.files
    });
    
    console.log('✅ Script content updated:', JSON.stringify(updateResult, null, 2));
    
    // Step 2: Create a new version
    console.log('\n📦 Step 2: Creating new version...');
    
    const versionResult = await createVersionTool.function({
      scriptId: scriptId,
      description: 'Web app version created via MCP tools'
    });
    
    console.log('✅ Version created:', JSON.stringify(versionResult, null, 2));
    
    if (!versionResult.versionNumber) {
      throw new Error('Failed to create version');
    }
    
    // Step 3: Create deployment
    console.log('\n🚀 Step 3: Creating deployment...');
    
    const deploymentResult = await createDeploymentTool.function({
      scriptId: scriptId,
      manifestFileName: 'appsscript',
      versionNumber: versionResult.versionNumber,
      description: 'Web app deployment via MCP tools'
    });
    
    console.log('✅ Deployment created:', JSON.stringify(deploymentResult, null, 2));
    
    if (!deploymentResult.deploymentId) {
      throw new Error('Failed to create deployment');
    }
    
    // Step 4: Get deployment details with entry points
    console.log('\n🔍 Step 4: Getting deployment details...');
    
    const deploymentDetails = await getDeploymentTool.function({
      scriptId: scriptId,
      deploymentId: deploymentResult.deploymentId
    });
    
    console.log('✅ Deployment details:', JSON.stringify(deploymentDetails, null, 2));
    
    // Check for web app URL
    if (deploymentDetails.entryPoints && deploymentDetails.entryPoints.length > 0) {
      console.log('\n🎉 SUCCESS! Web app deployment completed!');
      console.log('📱 Deployment ID:', deploymentResult.deploymentId);
      
      const webAppEntry = deploymentDetails.entryPoints.find(entry => entry.entryPointType === 'WEB_APP');
      if (webAppEntry) {
        console.log('🌐 Web App URL:', webAppEntry.webApp.url);
        console.log('🔒 Access Level:', webAppEntry.webApp.access);
        console.log('👤 Execute As:', webAppEntry.webApp.executeAs);
        console.log('\n🚀 Your web app is now live and accessible to anyone!');
      }
    } else {
      console.log('⚠️ Deployment created but no entry points found. May need to wait for propagation.');
    }
    
  } catch (error) {
    console.error('💥 Error during web app creation:', error);
  }
}

createCompleteWebAppViaMCP();
