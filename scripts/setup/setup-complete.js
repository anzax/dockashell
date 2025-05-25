#!/usr/bin/env node

// Complete setup script for DockaShell with default image
import { ImageBuilder } from '../image/build-default-image.js';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

async function setupDockaShell() {
  console.log('🚀 DockaShell Complete Setup\n');
  console.log(
    'This will build the default development image and create example projects.\n'
  );

  // Check Docker is available
  try {
    execSync('docker --version', { stdio: 'ignore' });
  } catch (error) {
    console.error(
      "❌ Docker not found. Please install Docker and ensure it's running."
    );
    process.exit(1);
  }

  // Step 1: Build default image
  console.log('📦 Step 1: Building default development image...\n');
  const builder = new ImageBuilder();

  const imageExists = await builder.checkImageExists();
  if (imageExists) {
    console.log('ℹ️ Default image already exists. Skipping build.');
    console.log('   Use "npm run rebuild-image" to force rebuild.\n');
  } else {
    const buildSuccess = await builder.buildDefaultImage();
    if (!buildSuccess) {
      console.error('❌ Failed to build default image. Setup aborted.');
      process.exit(1);
    }
    console.log('✅ Default image built successfully!\n');
  }

  // Step 2: Create example projects
  console.log('📋 Step 2: Creating example projects...\n');
  try {
    // Import and run the examples script
    const { execSync } = await import('child_process');
    execSync('node scripts/setup/create-examples.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to create example projects:', error.message);
    process.exit(1);
  }

  // Step 3: Success message
  console.log('\n🎉 DockaShell setup complete!\n');

  console.log('🛠️ Default Development Image:');
  console.log(`   Image: ${builder.getImageName()}`);
  console.log('   • Ubuntu 24.04 LTS + Node.js 22 LTS + Python 3');
  console.log('   • All essential CLI tools included');
  console.log('   • Non-root developer user with sudo access\n');

  console.log('📁 Example Projects Created:');
  console.log('   • web-app - Node.js development');
  console.log('   • data-science - Python data analysis');
  console.log('   • react-app - React/TypeScript development');
  console.log('   • fullstack-legacy - Custom image example\n');

  console.log('🧪 Next Steps:');
  console.log('   1. Test the MCP server: npm run debug');
  console.log(
    '   2. Try starting a project: start_project({"project_name": "web-app"})'
  );
  console.log(
    '   3. Run commands: run_command({"project_name": "web-app", "command": "node --version"})'
  );
  console.log(
    '   4. Check available tools: rg, tree, jq, curl, git, python3, etc.\n'
  );

  console.log('📖 Documentation:');
  console.log('   • README.md - Full project documentation');
  console.log('   • Project configs in ~/.dockashell/projects/');
  console.log('   • Traces in ~/.dockashell/projects/{name}/traces/\n');
}

setupDockaShell().catch(console.error);
