#!/usr/bin/env node

import { ImageBuilder } from '../image/build-default-image.js';
import fs from 'fs-extra';
import path from 'path';

async function setupDefaultImage() {
  console.log('🚀 Setting up DockaShell default development image...\n');
  
  // Check if Dockerfile exists
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
  if (!await fs.pathExists(dockerfilePath)) {
    console.log('❌ Dockerfile not found in current directory.');
    console.log('Please run this script from the DockaShell project root.');
    process.exit(1);
  }

  // Build the default image
  const builder = new ImageBuilder();
  
  console.log('🔨 Building default development image...\n');
  const success = await builder.buildDefaultImage();
  
  if (success) {
    console.log('\n✅ Default DockaShell development image is ready!');
    console.log(`📦 Image: ${builder.getImageName()}`);
    console.log('\n🛠️ This image includes:');
    console.log('  • Ubuntu 24.04 LTS (Noble Numbat)');
    console.log('  • Node.js 22 LTS + npm + pnpm');
    console.log('  • Python 3 + pip + venv');
    console.log('  • Essential CLI tools: patch, diff, grep, sed, gawk, rg, cat, head, tail, find, tree');
    console.log('  • Archive tools: zip, unzip');
    console.log('  • Network tools: curl, wget');
    console.log('  • Text editors: nano, vim');
    console.log('  • Development tools: git, jq, gcc, g++, make, cmake, build-essential');
    console.log('  • Non-root developer user with sudo access');
    console.log('\n📋 New projects will use this image by default unless specified otherwise.');
    console.log('\n🎯 Try creating a new project configuration that omits the "image" field to use the default.');
  } else {
    console.log('\n❌ Failed to build default image.');
    console.log('Please check:');
    console.log('  • Docker is installed and running');
    console.log('  • You have internet access for downloading packages');
    console.log('  • You have sufficient disk space');
    process.exit(1);
  }
}

setupDefaultImage().catch(console.error);
