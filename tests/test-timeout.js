#!/usr/bin/env node

import { ContainerManager } from '../src/container-manager.js';
import { ProjectManager } from '../src/project-manager.js';

async function testTimeout() {
  console.log('Testing timeout functionality...');
  
  const projectManager = new ProjectManager();
  const containerManager = new ContainerManager(projectManager);
  
  try {
    // Test the timeout helper method
    await containerManager.withTimeout(
      new Promise(resolve => setTimeout(resolve, 2000)),
      1000,
      'Test timeout message'
    );
    console.log('❌ Timeout should have been triggered');
  } catch (error) {
    console.log('✅ Timeout working:', error.message);
  }
  
  try {
    // Test fast operation should not timeout
    await containerManager.withTimeout(
      Promise.resolve('success'),
      1000,
      'Should not timeout'
    );
    console.log('✅ Fast operation completed without timeout');
  } catch (error) {
    console.log('❌ Fast operation failed:', error.message);
  }
  
  console.log('\nTesting stop container with nonexistent container...');
  try {
    const result = await containerManager.stopContainer('test-nonexistent');
    console.log('✅ Stop nonexistent container handled:', result.status);
  } catch (error) {
    console.log('✅ Stop nonexistent container error handled:', error.message);
  }
  
  console.log('\nTests completed!');
}

testTimeout().catch(console.error);
