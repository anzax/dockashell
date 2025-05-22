#!/usr/bin/env node

// Create example project configurations for testing
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

async function createExampleProjects() {
  console.log('Creating example DockaShell projects...\n');

  const dockashellDir = path.join(os.homedir(), '.dockashell');
  const projectsDir = path.join(dockashellDir, 'projects');

  // 1. Node.js Web App Project
  const webAppPath = path.join(projectsDir, 'web-app');
  await fs.ensureDir(webAppPath);
  
  const webAppConfig = {
    name: "web-app",
    description: "Node.js web application with hot reload",
    image: "node:18-bullseye",
    mounts: [
      {
        host: "~/projects/web-app",
        container: "/workspace",
        readonly: false
      }
    ],
    ports: [
      {
        host: 3000,
        container: 3000
      },
      {
        host: 8080,
        container: 8080
      }
    ],
    environment: {
      NODE_ENV: "development",
      PATH: "/workspace/node_modules/.bin:$PATH"
    },
    working_dir: "/workspace",
    shell: "/bin/bash",
    security: {
      restricted_mode: false,
      blocked_commands: ["rm -rf /", "sudo rm -rf", "mkfs"],
      max_execution_time: 300
    }
  };
  
  await fs.writeJSON(path.join(webAppPath, 'config.json'), webAppConfig, { spaces: 2 });
  await fs.ensureDir(webAppConfig.mounts[0].host.replace('~', os.homedir()));

  // 2. Python Data Science Project
  const pythonPath = path.join(projectsDir, 'data-science');
  await fs.ensureDir(pythonPath);
  
  const pythonConfig = {
    name: "data-science",
    description: "Python environment for data analysis and ML",
    image: "python:3.11-slim",
    mounts: [
      {
        host: "~/projects/data-science",
        container: "/workspace",
        readonly: false
      }
    ],
    ports: [
      {
        host: 8888,
        container: 8888
      }
    ],
    environment: {
      PYTHONPATH: "/workspace",
      JUPYTER_ENABLE_LAB: "yes"
    },
    working_dir: "/workspace",
    shell: "/bin/bash",
    security: {
      restricted_mode: false,
      blocked_commands: ["rm -rf /", "sudo", "passwd"],
      max_execution_time: 600
    }
  };
  
  await fs.writeJSON(path.join(pythonPath, 'config.json'), pythonConfig, { spaces: 2 });
  await fs.ensureDir(pythonConfig.mounts[0].host.replace('~', os.homedir()));

  // 3. React Development Project
  const reactPath = path.join(projectsDir, 'react-app');
  await fs.ensureDir(reactPath);
  
  const reactConfig = {
    name: "react-app",
    description: "React development environment with TypeScript",
    image: "node:18-alpine",
    mounts: [
      {
        host: "~/projects/react-app",
        container: "/app",
        readonly: false
      }
    ],
    ports: [
      {
        host: 3000,
        container: 3000
      }
    ],
    environment: {
      NODE_ENV: "development",
      CHOKIDAR_USEPOLLING: "true",
      WATCHPACK_POLLING: "true"
    },
    working_dir: "/app",
    shell: "/bin/sh",
    security: {
      restricted_mode: false,
      blocked_commands: [],
      max_execution_time: 300
    }
  };
  
  await fs.writeJSON(path.join(reactPath, 'config.json'), reactConfig, { spaces: 2 });
  await fs.ensureDir(reactConfig.mounts[0].host.replace('~', os.homedir()));

  console.log('✅ Example projects created:');
  console.log('   1. web-app (Node.js) - ports 3000, 8080');
  console.log('   2. data-science (Python) - port 8888');
  console.log('   3. react-app (React/TypeScript) - port 3000');
  console.log('\nProject directories created in ~/projects/');
  console.log('\nTo test, run:');
  console.log('   npm run test');
  console.log('\nThen try these commands in the MCP inspector:');
  console.log('   Tool: list_projects');
  console.log('   Tool: start_project, Args: {"project_name": "web-app"}');
  console.log('   Tool: run_command, Args: {"project_name": "web-app", "command": "node --version"}');
}

createExampleProjects().catch(console.error);
