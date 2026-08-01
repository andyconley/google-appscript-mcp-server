#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to update
const filesToUpdate = [
  'tools/google-app-script-api/apps-script-api/script-projects-deployments-create.js',
  'tools/google-app-script-api/apps-script-api/script-projects-deployments-get.js',
  'tools/google-app-script-api/apps-script-api/script-projects-deployments-list.js',
  'tools/google-app-script-api/apps-script-api/script-projects-deployments-update.js',
  'tools/google-app-script-api/apps-script-api/script-projects-get-content.js',
  'tools/google-app-script-api/apps-script-api/script-projects-get-metrics.js',
  'tools/google-app-script-api/apps-script-api/script-projects-update-content.js',
  'tools/google-app-script-api/apps-script-api/script-projects-versions-create.js',
  'tools/google-app-script-api/apps-script-api/script-projects-versions-get.js',
  'tools/google-app-script-api/apps-script-api/script-projects-versions-list.js',
  'tools/google-app-script-api/apps-script-api/script-processes-list-script-processes.js'
];

function updateFileForOAuth(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if already updated
  if (content.includes("import { getAuthHeaders } from '../../../lib/oauth-helper.js';")) {
    console.log(`✅ Already updated: ${filePath}`);
    return;
  }
  
  // Add import at the top
  if (!content.includes("import { getAuthHeaders }")) {
    content = `import { getAuthHeaders } from '../../../lib/oauth-helper.js';\n\n${content}`;
  }
  
  // Remove API key token assignment
  content = content.replace(/\s*const token = process\.env\.GOOGLE_APP_SCRIPT_API_API_KEY;\s*/g, '');
  content = content.replace(/\s*const apiKey = process\.env\.GOOGLE_APP_SCRIPT_API_API_KEY;\s*/g, '');
  
  // Replace header setup
  const headerPatterns = [
    // Pattern 1: Simple headers with token check
    /(\s*)\/\/ Set up headers for the request\s*\n\s*const headers = \{\s*\n\s*['"]Accept['"]:\s*['"]application\/json['"],?\s*\n\s*\};\s*\n\s*\/\/ If a token is provided, add it to the Authorization header\s*\n\s*if \(token\) \{\s*\n\s*headers\[['"]Authorization['"]\] = `Bearer \$\{token\}`;?\s*\n\s*\}/g,
    
    // Pattern 2: Headers with Content-Type
    /(\s*)\/\/ Set up headers for the request\s*\n\s*const headers = \{\s*\n\s*['"]Content-Type['"]:\s*['"]application\/json['"],?\s*\n\s*['"]Accept['"]:\s*['"]application\/json['"],?\s*\n\s*\};\s*\n\s*\/\/ If a token is provided, add it to the Authorization header\s*\n\s*if \(token\) \{\s*\n\s*headers\[['"]Authorization['"]\] = `Bearer \$\{token\}`;?\s*\n\s*\}/g,
    
    // Pattern 3: Authorization-only headers
    /(\s*)\/\/ Set up headers for the request\s*\n\s*const headers = \{\s*\n\s*['"]Authorization['"]:\s*`Bearer \$\{token\}`,?\s*\n\s*['"]Accept['"]:\s*['"]application\/json['"],?\s*\n\s*\}/g
  ];
  
  let headerReplaced = false;
  headerPatterns.forEach(pattern => {
    if (pattern.test(content) && !headerReplaced) {
      content = content.replace(pattern, '$1// Get OAuth headers\n$1const headers = await getAuthHeaders();');
      headerReplaced = true;
    }
  });
  
  // If no pattern matched, try a simpler approach
  if (!headerReplaced) {
    // Replace any Authorization header assignment
    content = content.replace(/headers\[['"]Authorization['"]\]\s*=\s*`Bearer \$\{token\}`;?/g, '');
    
    // Add OAuth headers if we can find where headers are defined
    if (content.includes('const headers = {') && !content.includes('await getAuthHeaders()')) {
      content = content.replace(
        /(const headers = \{[^}]*\});/,
        'const headers = await getAuthHeaders();'
      );
    }
  }
  
  // Wrap the fetch request in try-catch if not already
  if (!content.includes('try {') && content.includes('const response = await fetch')) {
    content = content.replace(
      /(const executeFunction = async \([^}]*\) => \{)/,
      '$1\n  try {'
    );
    content = content.replace(
      /(return data;\s*\}\s*catch)/,
      '$1'
    );
  }
  
  // Write the updated content
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Updated: ${filePath}`);
}

// Update all files
console.log('🔄 Converting Google Apps Script API files to use OAuth authentication...\n');

filesToUpdate.forEach(updateFileForOAuth);

console.log('\n✨ OAuth conversion completed!');
console.log('\n📝 Next steps:');
console.log('1. Update your .env file with OAuth credentials');
console.log('2. Follow the OAUTH_SETUP.md guide to get your credentials');
console.log('3. Test the authentication with one of the tools');
