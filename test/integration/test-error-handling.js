#!/usr/bin/env node

import { DockashellServer } from '../../src/mcp-server.js';

// Test error handling for each tool
async function testErrorHandling() {
  console.log('Testing DockaShell error handling...\n');
  
  const server = new DockashellServer();
  await server.initialize();
  
  // Test invalid project names
  console.log('1. Testing invalid project names:');
  try {
    await server.projectManager.loadProject('');
    console.log('  ❌ Empty project name should fail');
  } catch (error) {
    console.log(`  ✅ Empty project name: ${error.message}`);
  }
  
  try {
    await server.projectManager.loadProject('invalid/path');
    console.log('  ❌ Invalid project name should fail');
  } catch (error) {
    console.log(`  ✅ Invalid project name: ${error.message}`);
  }
  
  try {
    await server.projectManager.loadProject('nonexistent-project');
    console.log('  ❌ Nonexistent project should fail');
  } catch (error) {
    console.log(`  ✅ Nonexistent project: ${error.message}`);
  }
  
  // Test invalid commands
  console.log('\n2. Testing command validation:');
  try {
    server.securityManager.validateCommand('', {});
    console.log('  ❌ Empty command should fail');
  } catch (error) {
    console.log(`  ✅ Empty command: ${error.message}`);
  }
  
  try {
    server.securityManager.validateCommand('ls -la', null);
    console.log('  ❌ Null config should fail');
  } catch (error) {
    console.log(`  ✅ Null config: ${error.message}`);
  }
  
  // Test security with restricted mode
  console.log('\n3. Testing security restrictions:');
  const restrictedConfig = {
    security: {
      restricted_mode: true,
      blocked_commands: ['rm -rf /']
    }
  };
  
  try {
    server.securityManager.validateCommand('rm -rf /', restrictedConfig);
    console.log('  ❌ Blocked command should fail');
  } catch (error) {
    console.log(`  ✅ Blocked command: ${error.message}`);
  }
  
  try {
    server.securityManager.validateCommand('ls -la', restrictedConfig);
    console.log('  ✅ Safe command passed validation');
  } catch (error) {
    console.log(`  ❌ Safe command failed: ${error.message}`);
  }
  
  // Test container operations timeout handling
  console.log('\n4. Testing container operations:');
  try {
    await server.containerManager.stopContainer('nonexistent-project');
    console.log('  ✅ Stop nonexistent container handled gracefully');
  } catch (error) {
    console.log(`  ✅ Stop nonexistent container error: ${error.message}`);
  }
  
  try {
    await server.containerManager.getStatus('nonexistent-project');
    console.log('  ✅ Status for nonexistent container handled gracefully');
  } catch (error) {
    console.log(`  ❌ Status check failed: ${error.message}`);
  }
  
  // Test timeout helper
  console.log('\n5. Testing timeout functionality:');
  try {
    await server.containerManager.withTimeout(
      new Promise(resolve => setTimeout(resolve, 2000)),
      1000,
      'Test timeout'
    );
    console.log('  ❌ Timeout should have triggered');
  } catch (error) {
    console.log(`  ✅ Timeout triggered: ${error.message}`);
  }
  
  console.log('\n🎉 Error handling tests completed!');
}

testErrorHandling().catch(console.error);
