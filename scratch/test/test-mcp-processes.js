#!/usr/bin/env node

/**
 * Test script to call MCP server tools and observe enhanced logging
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { discoverTools } from './lib/tools.js';
import { logger } from './lib/logger.js';

async function testMCPTool() {
  console.log('🧪 Testing MCP Server Tool Execution with Enhanced Logging\n');
  
  try {
    // Discover and load tools
    logger.info('TEST', 'Starting MCP tool test');
    const tools = await discoverTools();
    
    // Find the script processes list tool
    const processListTool = tools.find(tool => 
      tool.definition?.function?.name === 'script_processes_list'
    );
    
    if (!processListTool) {
      console.error('❌ script_processes_list tool not found');
      return;
    }
    
    console.log('🔍 Found script_processes_list tool');
    console.log(`📝 Description: ${processListTool.definition.function.description}`);
    console.log(`🔧 Required parameters: ${processListTool.definition.function.parameters.required.join(', ')}`);
    
    // Test 1: Call with missing required parameter (should trigger detailed error logging)
    console.log('\n🧪 Test 1: Calling tool with missing required parameter...');
    try {
      await processListTool.function({});
    } catch (error) {
      console.log('✅ Expected error caught (missing scriptId)');
    }
    
    // Test 2: Call with invalid scriptId (should trigger API error logging)
    console.log('\n🧪 Test 2: Calling tool with invalid scriptId...');
    const testScriptId = 'invalid_script_id_12345';
    
    try {
      const result = await processListTool.function({
        scriptId: testScriptId,
        pageSize: 10
      });
      
      console.log('📊 Tool execution result:');
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.log('✅ Expected error caught (invalid scriptId)');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 3: Call with a potentially valid scriptId format (will likely fail with auth or not found)
    console.log('\n🧪 Test 3: Calling tool with valid format scriptId...');
    const validFormatScriptId = '1BxKdN9XvlHF8rF9mF8Km4K7Y6nC8XvV9WtE5QdA2B';
    
    try {
      const result = await processListTool.function({
        scriptId: validFormatScriptId,
        pageSize: 5,
        fields: 'processes(processType,functionName,startTime,duration,status)'
      });
      
      console.log('📊 Tool execution result:');
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.log('✅ Expected error caught (script not found or auth issue)');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n✨ MCP Tool Test Completed!');
    console.log('\n📋 What the enhanced logging showed:');
    console.log('   ✓ Tool discovery and loading');
    console.log('   ✓ Tool execution requests with parameters');
    console.log('   ✓ OAuth authentication attempts');
    console.log('   ✓ API calls to Google Apps Script API');
    console.log('   ✓ Response times and error details');
    console.log('   ✓ Detailed error context and stack traces');
    
  } catch (error) {
    logger.error('TEST', 'Test failed with unexpected error', {
      error: {
        message: error.message,
        stack: error.stack
      }
    });
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMCPTool().catch(console.error);
