#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import os from 'os';

async function setupDockashell() {
  console.log('🚀 Setting up DockaShell configuration...\n');

  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.dockashell');
  const projectsDir = path.join(configDir, 'projects');
  const logsDir = path.join(configDir, 'logs');

  // Create config directory structure
  await fs.ensureDir(configDir);
  await fs.ensureDir(projectsDir);
  await fs.ensureDir(logsDir);

  // Create global config matching src/config.js defaultConfig
  const globalConfigPath = path.join(configDir, 'config.json');
  const globalConfig = {
    tui: {
      display: {
        max_entries: 100,
      },
    },
    logging: {
      traces: {
        session_timeout: '4h',
      },
    },
  };
  await fs.writeJSON(globalConfigPath, globalConfig, { spaces: 2 });

  // Create dockashell project config
  const dockashellProjectDir = path.join(projectsDir, 'dockashell');
  await fs.ensureDir(dockashellProjectDir);

  const dockashellConfigPath = path.join(dockashellProjectDir, 'config.json');
  const dockashellConfig = {
    name: 'dockashell',
    description: 'dockashell dev environment',
    image: 'dockashell/default-dev:latest',
    mounts: [
      {
        host: process.cwd(),
        container: '/workspace',
        readonly: false,
      },
    ],
    ports: [
      {
        host: 3333,
        container: 3333,
      },
    ],
    environment: {
      NODE_ENV: 'development',
    },
    working_dir: '/workspace',
    shell: '/bin/bash',
    security: {
      restricted_mode: false,
      blocked_commands: [],
      max_execution_time: 300,
    },
  };
  await fs.writeJSON(dockashellConfigPath, dockashellConfig, { spaces: 2 });

  // Create test-project config
  const testProjectDir = path.join(projectsDir, 'test-project');
  await fs.ensureDir(testProjectDir);

  const testConfigPath = path.join(testProjectDir, 'config.json');
  const testConfig = {
    name: 'test-project',
    description: 'Test project for validation',
    image: 'dockashell/default-dev:latest',
    mounts: [
      {
        host: path.join(homeDir, 'tmp', 'test-project'),
        container: '/workspace',
        readonly: false,
      },
    ],
    ports: [
      {
        host: 8080,
        container: 8080,
      },
    ],
    environment: {
      NODE_ENV: 'development',
    },
    working_dir: '/workspace',
    shell: '/bin/bash',
    security: {
      restricted_mode: false,
      blocked_commands: [],
      max_execution_time: 300,
    },
  };
  await fs.writeJSON(testConfigPath, testConfig, { spaces: 2 });

  // Create test project directory
  const testProjectWorkspace = path.join(homeDir, 'tmp', 'test-project');
  await fs.ensureDir(testProjectWorkspace);

  console.log('✅ DockaShell configuration created successfully!');
  console.log(`📁 Config directory: ${configDir}`);
  console.log('📋 Projects configured:');
  console.log(`  • dockashell: ${process.cwd()} → /workspace`);
  console.log(`  • test-project: ${testProjectWorkspace} → /workspace`);
  console.log('\n🏗️ Next: Build the default Docker image with:');
  console.log('   npm run setup-image');
}

setupDockashell().catch(console.error);
