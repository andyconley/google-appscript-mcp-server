#!/usr/bin/env node

/**
 * Test script to demonstrate enhanced MCP server logging
 */

import { logger } from './lib/logger.js';
import { discoverTools } from './lib/tools.js';

async function testLogging() {
  console.log('🧪 Testing Enhanced MCP Server Logging\n');
  
  // Test different log levels
  logger.info('TEST', 'Testing different log levels');
  logger.debug('TEST', 'This is a debug message', { detail: 'debug info' });
  logger.warn('TEST', 'This is a warning message');
  logger.error('TEST', 'This is an error message', { error: 'test error' });
  
  console.log('\n📋 Current Log Configuration:');
  console.log(`   - Log Level: ${process.env.LOG_LEVEL || 'info'}`);
  console.log(`   - Enabled Levels: ${logger.enabledLevels.join(', ')}`);
  
  console.log('\n🔍 Discovering Tools with Enhanced Logging:');
  try {
    const tools = await discoverTools();
    console.log(`\n✅ Discovered ${tools.length} tools successfully`);
    
    console.log('\n📊 Tool Summary:');
    tools.forEach((tool, index) => {
      const name = tool.definition?.function?.name || 'Unknown';
      const description = tool.definition?.function?.description || 'No description';
      console.log(`   ${index + 1}. ${name}: ${description.substring(0, 60)}...`);
    });
    
  } catch (error) {
    console.error('❌ Failed to discover tools:', error.message);
  }
  
  console.log('\n🎯 Example Tool Invocation Logging:');
  logger.logToolRequest('example_tool', { param1: 'value1', param2: 'value2' });
  
  // Simulate tool execution
  setTimeout(() => {
    logger.logToolResponse('example_tool', { result: 'success', data: 'sample data' }, 150, 'req_123');
  }, 100);
  
  setTimeout(() => {
    logger.logToolError('failing_tool', new Error('Simulated error'), 300, 'req_124');
  }, 200);
  
  console.log('\n📝 API Call Logging Example:');
  logger.logAPICall('GET', 'https://script.googleapis.com/v1/projects/test123', {
    'Authorization': 'Bearer token123',
    'Content-Type': 'application/json'
  });
  
  setTimeout(() => {
    logger.logAPIResponse('GET', 'https://script.googleapis.com/v1/projects/test123', 200, 250, 1024);
  }, 50);
  
  console.log('\n🔐 Authentication Logging Example:');
  logger.logAuthentication('OAuth', true, { 
    tokenType: 'Bearer',
    scope: 'https://www.googleapis.com/auth/script.projects'
  });
  
  console.log('\n✨ Enhanced logging test completed!');
  console.log('\n💡 Tips for using enhanced logging:');
  console.log('   - Set LOG_LEVEL=debug in .env for more detailed logs');
  console.log('   - Set LOG_LEVEL=error in .env for minimal logs');
  console.log('   - All tool executions now include request/response timing');
  console.log('   - API calls are logged with sanitized headers');
  console.log('   - Authentication events are tracked');
  console.log('   - Error details include stack traces and context');
}

// Run the test
testLogging().catch(console.error);
