#!/usr/bin/env node

/**
 * Simple MCP Server Test - Fetch Script Processes List
 * This test focuses on fetching script processes using the MCP tool to identify errors
 */

import { discoverTools } from './lib/tools.js';
import { logger } from './lib/logger.js';

// Known working script ID from previous tests
const SCRIPT_ID = 'YOUR_SCRIPT_ID_HERE';

async function testFetchProcesses() {
  console.log('🔄 Testing MCP Server - Fetch Script Processes List\n');
  
  try {
    // Set logging to capture detailed information
    process.env.LOG_LEVEL = 'debug';
    
    console.log('🔍 Step 1: Discovering MCP tools...');
    const tools = await discoverTools();
    console.log(`✅ Found ${tools.length} tools\n`);
    
    // Find the script processes list tool
    const processListTool = tools.find(tool => 
      tool.definition?.function?.name === 'd94_script_processes_list' ||
      tool.definition?.function?.name === 'script_processes_list'
    );
    
    if (!processListTool) {
      console.error('❌ Script processes list tool not found');
      console.log('Available tools:');
      tools.forEach(tool => {
        console.log(`  - ${tool.definition?.function?.name}`);
      });
      return;
    }
    
    console.log('🎯 Step 2: Found script processes list tool');
    console.log(`   Name: ${processListTool.definition.function.name}`);
    console.log(`   Description: ${processListTool.definition.function.description}`);
    console.log(`   Required params: ${processListTool.definition.function.parameters.required?.join(', ') || 'none'}\n`);
    
    // Test the tool with minimal parameters
    console.log('🚀 Step 3: Calling tool to fetch processes...');
    console.log(`   Script ID: ${SCRIPT_ID}`);
    
    try {
      const startTime = Date.now();
      
      const result = await processListTool.function({
        scriptId: SCRIPT_ID,
        pageSize: 10
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Success! Call completed in ${duration}ms`);
      console.log('\n📊 RESULT:');
      console.log('=' .repeat(50));
      
      if (result && typeof result === 'object') {
        if (result.processes && Array.isArray(result.processes)) {
          console.log(`Found ${result.processes.length} processes:`);
          result.processes.forEach((process, index) => {
            console.log(`\n  Process ${index + 1}:`);
            console.log(`    Function: ${process.functionName || 'N/A'}`);
            console.log(`    Type: ${process.processType || 'N/A'}`);
            console.log(`    Status: ${process.processStatus || 'N/A'}`);
            console.log(`    Start: ${process.startTime || 'N/A'}`);
            console.log(`    Duration: ${process.duration || 'N/A'}`);
          });
        } else {
          console.log('No processes found in result');
        }
        
        if (result.nextPageToken) {
          console.log(`\nNext page token available: ${result.nextPageToken.substring(0, 20)}...`);
        }
      } else {
        console.log('Unexpected result format:');
        console.log(JSON.stringify(result, null, 2));
      }
      
    } catch (error) {
      console.log('\n❌ ERROR OCCURRED:');
      console.log('=' .repeat(50));
      console.log(`Error Type: ${error.constructor.name}`);
      console.log(`Error Message: ${error.message}`);
      
      if (error.response) {
        console.log(`HTTP Status: ${error.response.status}`);
        console.log(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      
      if (error.stack) {
        console.log('\nStack Trace:');
        console.log(error.stack);
      }
      
      // Log additional context if available
      if (error.config) {
        console.log('\nRequest Config:');
        console.log(`URL: ${error.config.url}`);
        console.log(`Method: ${error.config.method?.toUpperCase()}`);
        console.log(`Headers: ${JSON.stringify(error.config.headers, null, 2)}`);
      }
    }
    
  } catch (setupError) {
    console.log('\n💥 SETUP ERROR:');
    console.log('=' .repeat(50));
    console.log(`Error: ${setupError.message}`);
    console.log(`Stack: ${setupError.stack}`);
  }
  
  console.log('\n🏁 Test completed\n');
}

// Test with problematic fields parameter
async function testProblematicFields() {
  console.log('🔥 Testing Problematic Fields Parameter\n');
  
  try {
    const tools = await discoverTools();
    const processListTool = tools.find(tool => 
      tool.definition?.function?.name === 'd94_script_processes_list' ||
      tool.definition?.function?.name === 'script_processes_list'
    );
    
    if (!processListTool) {
      console.log('❌ Tool not found for fields test');
      return;
    }
    
    console.log('🧪 Testing with known problematic fields parameter...');
    
    try {
      const result = await processListTool.function({
        scriptId: SCRIPT_ID,
        pageSize: 5,
        fields: 'processes(processType,functionName,startTime,duration,status)'
      });
      
      console.log('😮 Unexpected success with problematic fields!');
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.log('✅ Expected error with invalid "status" field:');
      console.log(`   Error: ${error.message}`);
      
      if (error.response?.data) {
        console.log('   API Response:');
        console.log(JSON.stringify(error.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.log(`❌ Fields test setup error: ${error.message}`);
  }
}

// Run both tests
async function runAllTests() {
  await testFetchProcesses();
  console.log('\n' + '='.repeat(60) + '\n');
  await testProblematicFields();
}

runAllTests().catch(console.error);
