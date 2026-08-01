// Script to update all MCP tools with enhanced error handling
import fs from 'fs';
import path from 'path';

const toolsDir = './tools/google-app-script-api/apps-script-api';
const files = [
  'script-projects-update-content.js',
  'script-projects-deployments-update.js', 
  'script-projects-deployments-get.js',
  'script-projects-get-metrics.js',
  'script-scripts-run.js',
  'script-projects-deployments-delete.js',
  'script-projects-versions-get.js'
];

const loggerImport = `import { logger } from '../../../lib/logger.js';`;

for (const file of files) {
  const filePath = path.join(toolsDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add logger import if not present
    if (!content.includes("import { logger }")) {
      // Find the first import and add logger import after it
      const firstImportMatch = content.match(/import .+ from .+;/);
      if (firstImportMatch) {
        const firstImport = firstImportMatch[0];
        content = content.replace(firstImport, firstImport + '\n' + loggerImport);
      }
    }
    
    // Replace simple error returns with detailed logging
    const simpleErrorPattern = /return \{ error: '.*\.' \};/g;
    const errorMatches = content.match(simpleErrorPattern);
    
    if (errorMatches) {
      console.log(`Updating ${file}...`);
      
      // This would need custom logic for each file based on its specific structure
      // For now, we'll note which files need manual update
      console.log(`  - Found error patterns: ${errorMatches.length}`);
    }
  }
}

console.log('Script completed. Manual updates still needed for specific error handling patterns.');
