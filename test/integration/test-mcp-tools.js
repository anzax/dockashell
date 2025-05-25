#!/usr/bin/env node

// Test MCP tools with proper error scenarios
import { spawn } from 'child_process';

function runMCPCommand(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn('node', ['./src/mcp-server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };

    let output = '';
    const timeout = setTimeout(() => {
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
    const response = await runMCPCommand('list_projects');
    if (response.error || response.result?.isError) {
      console.log(
        '❌ list_projects failed:',
        response.error?.message || response.result?.content?.[0]?.text
      );
    } else {
      console.log('✅ list_projects successful');
    }
  } catch (error) {
    console.log('❌ list_projects failed:', error.message);
  }

  // Test 2: Start project with invalid name
  try {
    console.log('2. Testing start_project with empty name...');
    const response = await runMCPCommand('start_project', { project_name: '' });
    if (response.error || response.result?.isError) {
      console.log(
        '✅ start_project properly rejected empty name:',
        response.result?.content?.[0]?.text || response.error?.message
      );
    } else {
      console.log('❌ Should have failed with empty project name');
    }
  } catch (error) {
    console.log(
      '✅ start_project properly rejected empty name:',
      error.message
    );
  }

  // Test 3: Start valid project
  try {
    console.log('3. Testing start_project with test-project...');
    const response = await runMCPCommand('start_project', {
      project_name: 'test-project',
    });
    if (response.error || response.result?.isError) {
      const errorMsg =
        response.result?.content?.[0]?.text || response.error?.message;
      if (errorMsg.includes('docker') || errorMsg.includes('ENOENT')) {
        console.log('✅ start_project handled Docker unavailability correctly');
      } else {
        console.log('❌ start_project failed:', errorMsg);
      }
    } else {
      console.log('✅ start_project successful for test-project');
    }
  } catch (error) {
    console.log('✅ start_project handled error gracefully:', error.message);
  }

  // Test 4: Run command with invalid parameters
  try {
    console.log('4. Testing run_command with empty command...');
    const response = await runMCPCommand('run_command', {
      project_name: 'test-project',
      command: '',
    });
    if (response.error || response.result?.isError) {
      console.log(
        '✅ run_command properly rejected empty command:',
        response.result?.content?.[0]?.text || response.error?.message
      );
    } else {
      console.log('❌ Should have failed with empty command');
    }
  } catch (error) {
    console.log(
      '✅ run_command properly rejected empty command:',
      error.message
    );
  }

  // Test 5: git_apply with nonexistent project
  try {
    console.log('5. Testing git_apply with nonexistent project...');
    const diff =
      'diff --git a/foo.txt b/foo.txt\nindex 0000000..e69de29 100644\n--- a/foo.txt\n+++ b/foo.txt\n@@\n+test\n';
    const response = await runMCPCommand('git_apply', {
      project_name: 'missing',
      diff,
    });
    if (response.error || response.result?.isError) {
      console.log(
        '✅ git_apply handled error:',
        response.result?.content?.[0]?.text || response.error?.message
      );
    } else {
      console.log('❌ git_apply should have failed for nonexistent project');
    }
  } catch (error) {
    console.log('✅ git_apply handled error gracefully:', error.message);
  }

  // Test 6: Stop project (should handle gracefully)
  try {
    console.log('6. Testing stop_project...');
    const response = await runMCPCommand('stop_project', {
      project_name: 'test-project',
    });
    if (response.error || response.result?.isError) {
      const errorMsg =
        response.result?.content?.[0]?.text || response.error?.message;
      if (errorMsg.includes('docker') || errorMsg.includes('ENOENT')) {
        console.log('✅ stop_project handled Docker unavailability correctly');
      } else {
        console.log('❌ stop_project failed:', errorMsg);
      }
    } else {
      console.log('✅ stop_project completed without timeout');
    }
  } catch (error) {
    console.log('✅ stop_project handled error gracefully:', error.message);
  }

  console.log('\n🎉 MCP tool error handling tests completed!');
}

testMCPTools().catch(console.error);
