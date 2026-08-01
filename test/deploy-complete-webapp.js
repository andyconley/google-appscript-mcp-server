import { getOAuthAccessToken } from '../lib/oauth-helper.js';

const scriptId = 'YOUR_SCRIPT_ID_HERE';

async function updateScriptWithWebAppConfig() {
  try {
    const token = await getOAuthAccessToken();
    
    console.log('Updating script with web app configuration...');
    
    // Updated manifest with web app configuration
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

    // Prepare the updated script content
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
    .setTitle('Hello World App')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Server-side function that can be called from the client
 */
function getGreeting(name) {
  if (!name) {
    name = 'World';
  }
  return \`Hello, \${name}! This is a Google Apps Script web app.\`;
}

/**
 * Function to get current timestamp
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hello World - Google Apps Script</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: white;
    }
    
    .container {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    
    h1 {
      font-size: 2.5em;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .input-group {
      margin: 20px 0;
    }
    
    input[type="text"] {
      padding: 12px 20px;
      font-size: 16px;
      border: none;
      border-radius: 25px;
      width: 250px;
      text-align: center;
      background: rgba(255, 255, 255, 0.9);
      color: #333;
    }
    
    button {
      background: #ff6b6b;
      color: white;
      border: none;
      padding: 12px 25px;
      font-size: 16px;
      border-radius: 25px;
      cursor: pointer;
      margin: 10px;
      transition: all 0.3s ease;
    }
    
    button:hover {
      background: #ff5252;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .result {
      margin: 20px 0;
      padding: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      font-size: 18px;
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
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌟 Hello World App 🌟</h1>
    <p>Welcome to your Google Apps Script web application!</p>
    
    <div class="input-group">
      <input type="text" id="nameInput" placeholder="Enter your name (optional)" />
    </div>
    
    <div>
      <button onclick="sayHello()">Say Hello</button>
      <button onclick="getTime()">Get Current Time</button>
    </div>
    
    <div id="result" class="result">
      Click a button to see the magic! ✨
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
    }
    
    function onTimeSuccess(result) {
      hideLoading();
      document.getElementById('result').innerHTML = \`
        <div style="font-size: 18px;">
          🕐 Current server time: <br>
          <strong>\${result}</strong>
        </div>
      \`;
    }
    
    function onFailure(error) {
      hideLoading();
      document.getElementById('result').innerHTML = \`
        <div style="color: #ff6b6b;">
          ❌ Error: \${error.message}
        </div>
      \`;
    }
    
    function showLoading() {
      document.getElementById('loading').style.display = 'block';
      document.getElementById('result').style.display = 'none';
    }
    
    function hideLoading() {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('result').style.display = 'flex';
    }
    
    // Initialize the page
    window.onload = function() {
      document.getElementById('timestamp').innerHTML = 
        \`Page loaded at: \${new Date().toLocaleString()}\`;
    };
  </script>
</body>
</html>`
        }
      ]
    };

    console.log('Updated manifest:', JSON.stringify(updatedManifest, null, 2));

    // Update the script content
    const response = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(scriptContent)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Script updated successfully');
    
    return data;
  } catch (error) {
    console.error('Error updating script:', error);
    return null;
  }
}

async function createNewVersion() {
  try {
    const token = await getOAuthAccessToken();
    
    console.log('Creating new version...');
    
    const versionData = {
      description: "Version with web app configuration"
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

async function createWebAppDeployment(versionNumber) {
  try {
    const token = await getOAuthAccessToken();
    
    console.log('Creating web app deployment...');
    
    const deploymentConfig = {
      description: "Hello World Web App - Public Access",
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

async function getDeploymentDetails(deploymentId) {
  try {
    const token = await getOAuthAccessToken();
      console.log(`Getting deployment details for: ${deploymentId}`);
    
    const response = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments/${deploymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Deployment details:', JSON.stringify(data, null, 2));
    
    if (data.entryPoints && data.entryPoints[0] && data.entryPoints[0].webApp) {
      console.log('\n🎉 SUCCESS! Your web app is deployed!');
      console.log('Web App URL:', data.entryPoints[0].webApp.url);
      console.log('Access Level:', data.entryPoints[0].webApp.access);
      console.log('Execute As:', data.entryPoints[0].webApp.executeAs);
      console.log('\n📱 You can now access your Hello World app at the URL above!');
    } else {
      console.log('\n⚠️  No web app entry point found.');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting deployment details:', error);
    return null;
  }
}

async function main() {
  console.log('=== Creating Google Apps Script Web App ===\n');
  
  // Step 1: Update script with web app configuration
  console.log('Step 1: Updating script with web app configuration...');
  const updateResult = await updateScriptWithWebAppConfig();
  if (!updateResult) return;
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 2: Create a new version
  console.log('Step 2: Creating a new version...');
  const versionResult = await createNewVersion();
  if (!versionResult) return;
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 3: Create deployment with the new version
  console.log('Step 3: Creating deployment...');
  const deploymentResult = await createWebAppDeployment(versionResult.versionNumber);
  if (!deploymentResult) return;
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 4: Get deployment details to see the web app URL
  console.log('Step 4: Getting deployment details...');
  await getDeploymentDetails(deploymentResult.deploymentId);
}

main().catch(console.error);
