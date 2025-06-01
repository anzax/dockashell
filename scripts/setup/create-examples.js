#!/usr/bin/env node

// Create example project configurations optimized for the default image
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

async function createExampleProjects() {
  console.log('🚀 Creating example DockaShell projects...\n');

  const dockashellDir = path.join(os.homedir(), '.dockashell');
  const projectsDir = path.join(dockashellDir, 'projects');

  // 1. Node.js Web App Project (using default image)
  const webAppPath = path.join(projectsDir, 'web-app');
  await fs.ensureDir(webAppPath);

  const webAppConfig = {
    name: 'web-app',
    description: 'Node.js web application with hot reload',
    // image field omitted - will use default dockashell/default-dev:latest
    mounts: [
      {
        host: '~/projects/web-app',
        container: '/workspace',
        readonly: false,
      },
    ],
    ports: [
      {
        host: 3000,
        container: 3000,
      },
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
      max_execution_time: 300,
    },
  };

  await fs.writeJSON(path.join(webAppPath, 'config.json'), webAppConfig, {
    spaces: 2,
  });
  await fs.ensureDir(webAppConfig.mounts[0].host.replace('~', os.homedir()));

  // 2. Python Data Science Project (using default image)
  const pythonPath = path.join(projectsDir, 'data-science');
  await fs.ensureDir(pythonPath);

  const pythonConfig = {
    name: 'data-science',
    description: 'Python environment for data analysis and ML',
    // image field omitted - will use default dockashell/default-dev:latest
    mounts: [
      {
        host: '~/projects/data-science',
        container: '/workspace',
        readonly: false,
      },
    ],
    ports: [
      {
        host: 8888,
        container: 8888,
      },
    ],
    environment: {
      PYTHONPATH: '/workspace',
      JUPYTER_ENABLE_LAB: 'yes',
    },
    working_dir: '/workspace',
    shell: '/bin/bash',
    security: {
      max_execution_time: 600,
    },
  };

  await fs.writeJSON(path.join(pythonPath, 'config.json'), pythonConfig, {
    spaces: 2,
  });
  await fs.ensureDir(pythonConfig.mounts[0].host.replace('~', os.homedir()));

  // 3. React Development Project (using default image)
  const reactPath = path.join(projectsDir, 'react-app');
  await fs.ensureDir(reactPath);

  const reactConfig = {
    name: 'react-app',
    description: 'React development environment with TypeScript',
    // image field omitted - will use default dockashell/default-dev:latest
    mounts: [
      {
        host: '~/projects/react-app',
        container: '/workspace',
        readonly: false,
      },
    ],
    ports: [
      {
        host: 3000,
        container: 3000,
      },
    ],
    environment: {
      NODE_ENV: 'development',
      CHOKIDAR_USEPOLLING: 'true',
      WATCHPACK_POLLING: 'true',
    },
    working_dir: '/workspace',
    shell: '/bin/bash',
    security: {
      max_execution_time: 300,
    },
  };

  await fs.writeJSON(path.join(reactPath, 'config.json'), reactConfig, {
    spaces: 2,
  });
  await fs.ensureDir(reactConfig.mounts[0].host.replace('~', os.homedir()));

  // 4. Full-stack Project (custom image example)
  const fullstackPath = path.join(projectsDir, 'fullstack-legacy');
  await fs.ensureDir(fullstackPath);

  const fullstackConfig = {
    name: 'fullstack-legacy',
    description: 'Legacy fullstack project requiring specific Node.js version',
    image: 'node:16-bullseye', // Custom image for legacy requirements
    mounts: [
      {
        host: '~/projects/fullstack-legacy',
        container: '/workspace',
        readonly: false,
      },
    ],
    ports: [
      {
        host: 3000,
        container: 3000,
      },
      {
        host: 5432,
        container: 5432,
      },
    ],
    environment: {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/mydb',
    },
    working_dir: '/workspace',
    shell: '/bin/bash',
  };

  await fs.writeJSON(path.join(fullstackPath, 'config.json'), fullstackConfig, {
    spaces: 2,
  });
  await fs.ensureDir(fullstackConfig.mounts[0].host.replace('~', os.homedir()));

  console.log('✅ Example projects created:');
  console.log('   1. web-app (Node.js) - ports 3000, 8080 [DEFAULT IMAGE]');
  console.log('   2. data-science (Python) - port 8888 [DEFAULT IMAGE]');
  console.log('   3. react-app (React/TypeScript) - port 3000 [DEFAULT IMAGE]');
  console.log(
    '   4. fullstack-legacy (Node.js 16) - ports 3000, 5432 [CUSTOM IMAGE]'
  );
  console.log('\n📁 Project directories created in ~/projects/');
  console.log(
    '\n🏗️ Projects 1-3 will use the default DockaShell image (dockashell/default-dev:latest)'
  );
  console.log('   Run "npm run setup-image" to build the default image first');
  console.log('\n🧪 To test, run:');
  console.log('   npm run debug');
  console.log('\n🔧 Then try these commands in the MCP inspector:');
  console.log('   Tool: list_projects');
  console.log('   Tool: start_project, Args: {"project_name": "web-app"}');
  console.log(
    '   Tool: bash, Args: {"project_name": "web-app", "command": "node --version"}'
  );
  console.log(
    '   Tool: bash, Args: {"project_name": "web-app", "command": "python3 --version"}'
  );
  console.log(
    '   Tool: bash, Args: {"project_name": "web-app", "command": "which rg"}'
  );
}

createExampleProjects().catch(console.error);
