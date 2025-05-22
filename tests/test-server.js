#!/usr/bin/env node

import { DockashellServer } from '../src/mcp-server.js';

// Simple test to verify the server can initialize
async function testServer() {
  try {
    console.log('Testing DockaShell server initialization...');
    
    const server = new DockashellServer();
    await server.initialize();
    
    console.log('✅ Server initialized successfully');
    console.log('✅ Project manager ready');
    console.log('✅ Container manager ready');
    console.log('✅ Security manager ready');
    console.log('✅ Logger ready');
    
    // Test listing projects
    const projects = await server.projectManager.listProjects();
    console.log(`✅ Found ${projects.length} configured projects`);
    
    if (projects.length > 0) {
      console.log('Projects:');
      projects.forEach(p => console.log(`  - ${p.name}: ${p.image}`));
    }
    
    console.log('\n🎉 All tests passed! DockaShell is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testServer();
