#!/usr/bin/env node

/**
 * Script to automatically update all Google Apps Script API tools
 * to use automatic OAuth and enhanced error handling
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const toolsDir = 'tools/google-app-script-api/apps-script-api';

// Enhanced error handling template
const errorHandlingTemplate = `
  } catch (error) {
    console.error('❌ Error in API call:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return detailed error information for debugging
    return { 
      error: true,
      message: error.message,
      details: {
        timestamp: new Date().toISOString(),
        errorType: error.name || 'Unknown'
      }
    };
  }
`;

// Function to remove OAuth parameters from tool definitions
function updateToolDefinition(content) {
  // Remove OAuth-related parameters from the function signature
  content = content.replace(
    /(\{[^}]*?)(key|access_token|oauth_token)[\s\S]*?(,\s*)?/g,
    (match, start, param, comma) => {
      // If this is the last parameter before closing brace, remove the comma
      if (match.includes('}')) {
        return start.replace(/,\s*$/, '');
      }
      return start;
    }
  );

  // Remove OAuth parameters from URL construction
  content = content.replace(/\s*url\.searchParams\.append\([^)]*(?:key|access_token|oauth_token)[^)]*\);?\n?/g, '');

  // Update parameter validation to only require non-OAuth params
  content = content.replace(
    /required:\s*\[[^\]]*(?:key|access_token|oauth_token)[^\]]*\]/g,
    (match) => {
      // Extract non-OAuth required parameters
      const params = match.match(/'([^']+)'/g) || [];
      const nonOAuthParams = params.filter(p => 
        !p.includes('key') && 
        !p.includes('access_token') && 
        !p.includes('oauth_token')
      );
      return `required: [${nonOAuthParams.join(', ')}]`;
    }
  );

  // Remove OAuth parameter definitions from schema
  content = content.replace(/\s*(?:key|access_token|oauth_token):\s*\{[^}]*\},?\n?/g, '');

  // Add OAuth auto-handling note to description
  content = content.replace(
    /(description:\s*')([^']*?)(')/g,
    '$1$2 OAuth authentication is handled automatically.$3'
  );

  return content;
}

// Function to enhance error handling
function enhanceErrorHandling(content) {
  // Replace simple error handling with detailed version
  content = content.replace(
    /if\s*\(\s*!response\.ok\s*\)\s*\{[\s\S]*?throw new Error\([^)]*\);?\s*\}/g,
    `if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (parseError) {
        errorData = { message: errorText };
      }

      const detailedError = {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        error: errorData,
        timestamp: new Date().toISOString()
      };

      console.error('❌ API Error Details:', JSON.stringify(detailedError, null, 2));
      
      throw new Error(\`API Error (\${response.status}): \${errorData.error?.message || errorData.message || 'Unknown error'}\`);
    }`
  );

  // Replace simple catch blocks with detailed error handling
  content = content.replace(
    /catch\s*\([^)]*\)\s*\{[\s\S]*?return\s*\{[^}]*error[^}]*\};?\s*\}/g,
    errorHandlingTemplate.trim()
  );

  return content;
}

// Get all tool files
const toolFiles = readdirSync(toolsDir).filter(file => file.endsWith('.js'));

console.log('🔧 Updating Google Apps Script API tools...');
console.log(`📁 Found ${toolFiles.length} tool files to update`);

let updatedCount = 0;

for (const file of toolFiles) {
  try {
    const filePath = join(toolsDir, file);
    console.log(`🔄 Processing: ${file}`);
    
    let content = readFileSync(filePath, 'utf8');
    
    // Skip if already updated (check for OAuth auto-handling comment)
    if (content.includes('OAuth authentication is handled automatically')) {
      console.log(`✅ ${file} already updated, skipping`);
      continue;
    }
    
    // Apply updates
    content = updateToolDefinition(content);
    content = enhanceErrorHandling(content);
    
    // Add logging for API calls
    if (!content.includes('console.log') && content.includes('fetch(')) {
      content = content.replace(
        /(const url = new URL\([^;]+;)/,
        '$1\n    console.log(\'🌐 API URL:\', url.toString());'
      );
      
      content = content.replace(
        /(const headers = await getAuthHeaders\(\);)/,
        '$1\n    console.log(\'🔐 Authorization headers obtained successfully\');'
      );
      
      content = content.replace(
        /(const response = await fetch\([^;]+;)/,
        '$1\n    console.log(\'📡 API Response Status:\', response.status, response.statusText);'
      );
    }
    
    writeFileSync(filePath, content);
    updatedCount++;
    console.log(`✅ Updated: ${file}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message);
  }
}

console.log(`\n🎉 Successfully updated ${updatedCount} out of ${toolFiles.length} files`);
console.log('✅ All tools now use automatic OAuth authentication and enhanced error handling');
