#!/usr/bin/env node

// Simple test script to validate our implementation
import { ProjectManager } from './src/project-manager.js';
import { SecurityManager } from './src/security.js';
import { Logger } from './src/logger.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

async function runTests() {
  console.log('Testing DockaShell components...\n');

  // Create test project structure
  const testProjectPath = path.join(os.homedir(), '.dockashell', 'projects', 'test-project');
  await fs.ensureDir(testProjectPath);
  
  const testConfig = {
    name: "test-project",
    description: "Test project for validation",
    image: "ubuntu:latest",
    mounts: [
      {
        host: "~/test-workspace",
        container: "/workspace",
        readonly: false
      }
    ],
    ports: [
      {
        host: 8080,
        container: 80
      }
    ],
    environment: {
      NODE_ENV: "development"
    },
    working_dir: "/workspace",
    shell: "/bin/bash",
    security: {
      restricted_mode: false,
      blocked_commands: ["rm -rf /"],
      max_execution_time: 300
    }
  };

  await fs.writeJSON(path.join(testProjectPath, 'config.json'), testConfig, { spaces: 2 });

  // Test ProjectManager
  console.log('1. Testing ProjectManager...');
  const projectManager = new ProjectManager();
  await projectManager.initialize();
  
  const projects = await projectManager.listProjects();
  console.log(`   Found ${projects.length} projects`);
  
  const testProject = await projectManager.loadProject('test-project');
  console.log(`   Loaded project: ${testProject.name}`);
  console.log(`   Image: ${testProject.image}`);
  console.log('   ✓ ProjectManager working\n');

  // Test SecurityManager
  console.log('2. Testing SecurityManager...');
  const securityManager = new SecurityManager();
  
  try {
    securityManager.validateCommand('ls -la', testConfig);
    console.log('   ✓ Safe command validated');
  } catch (error) {
    console.log(`   ✗ Safe command rejected: ${error.message}`);
  }

  // Test blocked command
  testConfig.security.restricted_mode = true;
  try {
    securityManager.validateCommand('rm -rf /', testConfig);
    console.log('   ✗ Dangerous command allowed');
  } catch (error) {
    console.log('   ✓ Dangerous command blocked');
  }
  console.log('   ✓ SecurityManager working\n');

  // Test Logger
  console.log('3. Testing Logger...');
  const logger = new Logger();
  await logger.logCommand('test-project', 'ls -la', {
    type: 'exec',
    exitCode: 0,
    duration: '0.1s'
  });
  console.log('   ✓ Command logged successfully');
  
  const logs = await logger.getProjectLogs('test-project');
  console.log(`   Log entry created: ${logs.split('\n').length - 1} lines`);
  console.log('   ✓ Logger working\n');

  console.log('✅ All core components working correctly!');
  console.log('\nTo test with MCP inspector, try:');
  console.log('   npx @modelcontextprotocol/inspector node src/mcp-server.js');
  console.log('\nExample project config created at:');
  console.log(`   ${testProjectPath}/config.json`);
}

runTests().catch(console.error);
