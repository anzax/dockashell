#!/usr/bin/env node

// Test MCP tools with proper error scenarios
import { spawn } from 'child_process';

function runMCPCommand(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn('node', ['src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    let output = '';
    let timeout = setTimeout(() => {
      process.kill();
      reject(new Error('Request timed out'));
    }, 15000); // 15 second timeout
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      console.error('Server stderr:', data.toString());
    });
    
    process.on('close', (code) => {
      clearTimeout(timeout);
      try {
        const response = JSON.parse(output);
        resolve(response);
      } catch (error) {
        reject(new Error(`Failed to parse response: ${output}`));
      }
    });
    
    process.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    
    // Send the request
    process.stdin.write(JSON.stringify(request) + '\n');
    process.stdin.end();
  });
}

async function testMCPTools() {
  console.log('Testing MCP tools with error handling...\n');
  
  // Test 1: List projects (should work)
  try {
    console.log('1. Testing list_projects...');
    const result = await runMCPCommand('list_projects');
    console.log('✅ list_projects successful');
  } catch (error) {
    console.log('❌ list_projects failed:', error.message);
  }
  
  // Test 2: Start project with invalid name
  try {
    console.log('2. Testing start_project with empty name...');
    const result = await runMCPCommand('start_project', { project_name: '' });
    console.log('❌ Should have failed with empty project name');
  } catch (error) {
    console.log('✅ start_project properly rejected empty name:', error.message);
  }
  
  // Test 3: Start valid project
  try {
    console.log('3. Testing start_project with test-project...');
    const result = await runMCPCommand('start_project', { project_name: 'test-project' });
    console.log('✅ start_project successful for test-project');
  } catch (error) {
    console.log('❌ start_project failed:', error.message);
  }
  
  // Test 4: Run command with invalid parameters
  try {
    console.log('4. Testing run_command with empty command...');
    const result = await runMCPCommand('run_command', { 
      project_name: 'test-project', 
      command: '' 
    });
    console.log('❌ Should have failed with empty command');
  } catch (error) {
    console.log('✅ run_command properly rejected empty command:', error.message);
  }
  
  // Test 5: Stop project (should handle gracefully)
  try {
    console.log('5. Testing stop_project...');
    const result = await runMCPCommand('stop_project', { project_name: 'test-project' });
    console.log('✅ stop_project completed without timeout');
  } catch (error) {
    console.log('❌ stop_project failed:', error.message);
  }
  
  console.log('\n🎉 MCP tool error handling tests completed!');
}

testMCPTools().catch(console.error);
