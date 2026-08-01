#!/usr/bin/env node

/**
 * Update script content to dark theme and deploy as web app
 */

import { getOAuthAccessToken } from '../lib/oauth-helper.js';

const scriptId = 'YOUR_SCRIPT_ID_HERE';

// Dark theme HTML content
const darkThemeHTML = `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <title>Hello World App via MCP - Dark Theme</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #e0e0e0;
      text-align: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .container {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px;
      backdrop-filter: blur(15px);
      box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.3);
    }
    h1 {
      color: #ffffff;
      margin-bottom: 30px;
      font-size: 2.5em;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
    p {
      color: #b0b0b0;
      font-size: 1.1em;
      margin-bottom: 30px;
    }
    input {
      padding: 14px;
      margin: 10px;
      border: 2px solid #444;
      border-radius: 10px;
      font-size: 16px;
      width: 250px;
      background: #2a2a2a;
      color: #e0e0e0;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #64b5f6;
      box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.2);
    }
    input::placeholder {
      color: #888;
    }
    button {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      color: white;
      border: none;
      padding: 14px 28px;
      margin: 10px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
    }
    button:hover {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .result {
      margin-top: 25px;
      padding: 25px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f0f0f0;
      font-size: 18px;
    }
    .loading {
      display: none;
      color: #64b5f6;
      font-size: 18px;
      font-weight: 600;
    }
    .timestamp {
      margin-top: 15px;
      font-size: 0.9em;
      color: #888;
      font-style: italic;
    }
    .emoji {
      font-size: 1.2em;
      margin: 0 5px;
    }
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
    .loading {
      animation: pulse 1.5s infinite;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1><span class="emoji">🌙</span> Dark Theme MCP App <span class="emoji">🌙</span></h1>
    <p>This sleek dark-themed web app was created using MCP (Model Context Protocol) tools!</p>
    
    <div class="input-group">
      <input type="text" id="nameInput" placeholder="Enter your name (optional)" />
    </div>
    
    <div>
      <button onclick="sayHello()">🗨️ Say Hello</button>
      <button onclick="getTime()">🕒 Get Current Time</button>
    </div>
    
    <div id="result" class="result">
      Click a button to experience the dark MCP magic! ✨
    </div>
    
    <div id="loading" class="loading">⏳ Loading...</div>
    
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
        <div style="font-size: 20px; font-weight: bold; color: #64b5f6;">
          \${result}
        </div>
      \`;
      updateTimestamp();
    }
    
    function onTimeSuccess(result) {
      hideLoading();
      document.getElementById('result').innerHTML = \`
        <div style="font-size: 18px; color: #81c784;">
          🕒 Current Time: <strong style="color: #fff;">\${result}</strong>
        </div>
      \`;
      updateTimestamp();
    }
    
    function onFailure(error) {
      hideLoading();
      document.getElementById('result').innerHTML = \`
        <div style="color: #f48fb1;">
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
    
    // Add some interactive effects
    document.addEventListener('DOMContentLoaded', function() {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        button.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0) scale(1)';
        });
      });
    });
  </script>
</body>
</html>`;

// Updated server-side code
const serverCode = `/**
 * Serves the HTML page when the web app is accessed
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Hello World App via MCP - Dark Theme')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Server-side function that can be called from the client
 */
function getGreeting(name) {
  if (!name) {
    name = 'World';
  }
  return \`Hello, \${name}! This dark-themed web app was created via MCP tools.\`;
}

/**
 * Get current time
 */
function getCurrentTime() {
  return new Date().toLocaleString();
}`;

// Configuration
const appsScriptConfig = `{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "access": "ANYONE",
    "executeAs": "USER_ACCESSING"
  }
}`;

async function updateScriptContent() {
  try {
    const token = await getOAuthAccessToken();
    console.log('🔄 Updating script content with dark theme...');
    
    const files = [
      {
        name: "appsscript",
        type: "JSON",
        source: appsScriptConfig
      },
      {
        name: "code",
        type: "SERVER_JS", 
        source: serverCode
      },
      {
        name: "index",
        type: "HTML",
        source: darkThemeHTML
      }
    ];

    const response = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ files })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error updating content:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Script content updated successfully!');
    return data;
  } catch (error) {
    console.error('❌ Error updating script content:', error);
    return null;
  }
}

async function createVersion() {
  try {
    const token = await getOAuthAccessToken();
    console.log('📦 Creating new version...');
    
    const versionData = {
      description: "Dark theme version via MCP"
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
      console.error('❌ Error creating version:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Version ${data.versionNumber} created successfully!`);
    return data;
  } catch (error) {
    console.error('❌ Error creating version:', error);
    return null;
  }
}

async function createDeployment(versionNumber) {
  try {
    const token = await getOAuthAccessToken();
    console.log('🚀 Creating web app deployment...');
    
    const deploymentConfig = {
      description: "Dark Theme MCP Web App - Public Access",
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
      console.error('❌ Error creating deployment:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Deployment created successfully!');
    
    // Extract web app URL
    if (data.entryPoints && data.entryPoints[0] && data.entryPoints[0].webApp) {
      const webAppUrl = data.entryPoints[0].webApp.url;
      console.log('🌐 Web App URL:', webAppUrl);
    }
    
    console.log('📋 Deployment Details:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Error creating deployment:', error);
    return null;
  }
}

async function main() {
  console.log('🌙 Starting dark theme update and deployment...');
  console.log('='.repeat(60));
  
  // Step 1: Update script content
  const updateResult = await updateScriptContent();
  if (!updateResult) {
    console.log('❌ Failed to update content. Stopping.');
    return;
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Step 2: Create new version
  const versionResult = await createVersion();
  if (!versionResult) {
    console.log('❌ Failed to create version. Stopping.');
    return;
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Step 3: Create deployment
  const deploymentResult = await createDeployment(versionResult.versionNumber);
  if (!deploymentResult) {
    console.log('❌ Failed to create deployment. Stopping.');
    return;
  }
  
  console.log('\n🎉 Process completed successfully!');
  console.log('Your dark-themed web app is now deployed and accessible.');
}

main().catch(console.error);
