#!/usr/bin/env node

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
    }, 15000);

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      console.error('Server stderr:', data.toString());
    });

    process.on('close', (_code) => {
      clearTimeout(timeout);
      try {
        const response = JSON.parse(output);
        console.log('Full response:', JSON.stringify(response, null, 2));
        resolve(response);
      } catch (error) {
        reject(new Error(`Failed to parse response: ${error.message}`));
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

async function debugTest() {
  try {
    console.log('Testing start_project with empty name...');
    await runMCPCommand('start_project', { project_name: '' });
  } catch (error) {
    console.log('Error:', error.message);
  }
}

debugTest();
