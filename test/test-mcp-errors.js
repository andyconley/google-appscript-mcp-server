#!/usr/bin/env node

/**
 * Comprehensive MCP Server Error Testing Script
 * Tests the script processes list tool with real script ID to identify specific errors
 */

import { discoverTools } from './lib/tools.js';
import { logger } from './lib/logger.js';

// Real script ID used throughout the codebase
const REAL_SCRIPT_ID = 'YOUR_SCRIPT_ID_HERE';

async function testMCPErrors() {
  console.log('🚨 MCP Server Error Analysis - Script Processes List\n');
  
  try {
    // Set high verbosity for maximum details
    process.env.LOG_LEVEL = 'trace';
    
    // Discover tools
    logger.info('TEST', 'Starting comprehensive error analysis');
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
    console.log(`🔧 Required: ${processListTool.definition.function.parameters.required.join(', ')}`);
    console.log(`📋 Properties: ${Object.keys(processListTool.definition.function.parameters.properties).join(', ')}\n`);
    
    // TEST 1: Basic call with real script ID
    console.log('🧪 TEST 1: Basic call with real script ID');
    console.log(`🎯 Using script ID: ${REAL_SCRIPT_ID}`);
    try {
      const result1 = await processListTool.function({
        scriptId: REAL_SCRIPT_ID
      });
      console.log('✅ Success - Basic call worked');
      console.log(`📊 Result type: ${typeof result1}`);
      console.log(`📊 Result content: ${JSON.stringify(result1, null, 2)}`);
    } catch (error) {
      console.log('❌ Error in basic call:');
      console.log(`   Message: ${error.message}`);
      console.log(`   Type: ${error.constructor.name}`);
    }
    
    // TEST 2: Call with minimal valid fields parameter
    console.log('\n🧪 TEST 2: Call with valid fields parameter');
    try {
      const result2 = await processListTool.function({
        scriptId: REAL_SCRIPT_ID,
        fields: 'processes'
      });
      console.log('✅ Success - With fields parameter');
      console.log(`📊 Result: ${JSON.stringify(result2, null, 2)}`);
    } catch (error) {
      console.log('❌ Error with fields parameter:');
      console.log(`   Message: ${error.message}`);
      console.log(`   Type: ${error.constructor.name}`);
    }
    
    // TEST 3: Call with specific valid field selections
    console.log('\n🧪 TEST 3: Call with specific field selections');
    const validFields = [
      'processes(processType,functionName,startTime,duration)',
      'processes(processType,functionName)',
      'processes(startTime)',
      'processes.processType,processes.functionName'
    ];
    
    for (const field of validFields) {
      console.log(`\n   📝 Testing field: ${field}`);
      try {
        const result = await processListTool.function({
          scriptId: REAL_SCRIPT_ID,
          fields: field,
          pageSize: 3
        });
        console.log(`   ✅ Success with field: ${field}`);
        console.log(`   📊 Result: ${JSON.stringify(result, null, 2)}`);
      } catch (error) {
        console.log(`   ❌ Error with field '${field}': ${error.message}`);
      }
    }
    
    // TEST 4: Test different parameter combinations
    console.log('\n🧪 TEST 4: Testing different parameter combinations');
    
    const testCases = [
      { name: 'With pageSize only', params: { scriptId: REAL_SCRIPT_ID, pageSize: 5 } },
      { name: 'With pageToken', params: { scriptId: REAL_SCRIPT_ID, pageToken: 'test_token' } },
      { name: 'With deploymentId filter', params: { scriptId: REAL_SCRIPT_ID, deploymentId: 'test_deployment' } },
      { name: 'With functionName filter', params: { scriptId: REAL_SCRIPT_ID, functionName: 'myFunction' } },
      { name: 'With time filters', params: { 
        scriptId: REAL_SCRIPT_ID, 
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-12-31T23:59:59Z'
      }},
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   📝 Testing: ${testCase.name}`);
      try {
        const result = await processListTool.function(testCase.params);
        console.log(`   ✅ Success: ${testCase.name}`);
        console.log(`   📊 Result: ${JSON.stringify(result, null, 2)}`);
      } catch (error) {
        console.log(`   ❌ Error in ${testCase.name}: ${error.message}`);
      }
    }
    
    // TEST 5: Check if the script actually exists by trying to get its metadata
    console.log('\n🧪 TEST 5: Verify script exists by getting metadata');
    const scriptGetTool = tools.find(tool => 
      tool.definition?.function?.name === 'script_projects_get'
    );
    
    if (scriptGetTool) {
      try {
        const metadata = await scriptGetTool.function({
          scriptId: REAL_SCRIPT_ID
        });
        console.log('✅ Script metadata retrieved successfully');
        console.log(`📋 Script title: ${metadata.title || 'No title'}`);
        console.log(`📋 Script ID: ${metadata.scriptId || 'No ID'}`);
        console.log(`📋 Create time: ${metadata.createTime || 'No create time'}`);
      } catch (error) {
        console.log('❌ Error getting script metadata:');
        console.log(`   Message: ${error.message}`);
        console.log('   This might indicate the script doesn\'t exist or access issues');
      }
    }
    
  } catch (error) {
    logger.error('TEST', 'Test failed with unexpected error', {
      error: {
        message: error.message,
        stack: error.stack
      }
    });
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🏁 Error Analysis Complete');
  console.log('\n📋 Summary of Findings:');
  console.log('   • Check the detailed logs above for specific API errors');
  console.log('   • Look for authentication issues, invalid parameters, or API limitations');
  console.log('   • Note which parameter combinations work vs. which fail');
  console.log('   • Verify if the script ID is accessible with current OAuth scopes');
}

// Run the error analysis
testMCPErrors().catch(console.error);
