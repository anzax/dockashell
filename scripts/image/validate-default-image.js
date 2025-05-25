#!/usr/bin/env node

// Validate the default image implementation
import Docker from 'dockerode';
import { ImageBuilder } from './build-default-image.js';
import { ProjectManager } from '../../src/project-manager.js';

async function validateDefaultImage() {
  console.log('🔍 Validating DockaShell default image implementation...\n');

  let errors = 0;

  // Test 1: Check Docker is available
  try {
    const docker = new Docker();
    await docker.ping();
    console.log('✅ Docker is running');
  } catch (error) {
    console.error('❌ Docker is not available:', error.message);
    errors++;
  }

  // Test 2: Check Dockerfile exists
  try {
    const fs = await import('fs-extra');
    const dockerfileExists = await fs.pathExists('Dockerfile');
    if (dockerfileExists) {
      console.log('✅ Dockerfile exists');
    } else {
      console.error('❌ Dockerfile not found');
      errors++;
    }
  } catch (error) {
    console.error('❌ Error checking Dockerfile:', error.message);
    errors++;
  }

  // Test 3: Check ImageBuilder class
  try {
    const builder = new ImageBuilder();
    const imageName = builder.getImageName();
    if (imageName === 'dockashell/default-dev:latest') {
      console.log('✅ ImageBuilder class working correctly');
    } else {
      console.error(
        '❌ ImageBuilder returning incorrect image name:',
        imageName
      );
      errors++;
    }
  } catch (error) {
    console.error('❌ ImageBuilder class error:', error.message);
    errors++;
  }

  // Test 4: Check ProjectManager default image
  try {
    const projectManager = new ProjectManager();
    const defaultImage = projectManager.getDefaultImage();
    if (defaultImage === 'dockashell/default-dev:latest') {
      console.log('✅ ProjectManager default image configured correctly');
    } else {
      console.error(
        '❌ ProjectManager returning incorrect default image:',
        defaultImage
      );
      errors++;
    }
  } catch (error) {
    console.error('❌ ProjectManager error:', error.message);
    errors++;
  }

  // Test 5: Check if image exists (optional)
  try {
    const builder = new ImageBuilder();
    const imageExists = await builder.checkImageExists();
    if (imageExists) {
      console.log('✅ Default development image already built');
    } else {
      console.log(
        'ℹ️ Default development image not built yet (run "npm run setup-image")'
      );
    }
  } catch {
    console.log(
      'ℹ️ Could not check if image exists (this is normal if not built yet)'
    );
  }

  // Summary
  console.log(
    `\n📊 Validation Results: ${errors === 0 ? '✅ PASSED' : '❌ FAILED'}`
  );

  if (errors === 0) {
    console.log('\n🎉 Default image implementation is ready!');
    console.log('\nNext steps:');
    console.log(
      '  1. Run "npm run setup-complete" to build image and create examples'
    );
    console.log('  2. Run "npm run debug" to test with MCP inspector');
  } else {
    console.log(
      `\n❌ Found ${errors} error(s). Please fix them before proceeding.`
    );
    process.exit(1);
  }
}

validateDefaultImage().catch(console.error);
