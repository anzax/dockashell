#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

async function createTestProject() {
  const dockashellDir = path.join(os.homedir(), '.dockashell');
  const projectsDir = path.join(dockashellDir, 'projects');
  const testProjectDir = path.join(projectsDir, 'test-project');
  
  try {
    // Create directories
    await fs.mkdir(dockashellDir, { recursive: true });
    await fs.mkdir(projectsDir, { recursive: true });
    await fs.mkdir(testProjectDir, { recursive: true });
    
    // Create test project config
    const testConfig = {
      name: "test-project",
      description: "Test project for DockaShell",
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
    
    await fs.writeFile(
      path.join(testProjectDir, 'config.json'), 
      JSON.stringify(testConfig, null, 2)
    );
    
    console.log('✅ Created test project at:', testProjectDir);
    return testProjectDir;
  } catch (error) {
    console.error('❌ Failed to create test project:', error.message);
    throw error;
  }
}

createTestProject().catch(console.error);
