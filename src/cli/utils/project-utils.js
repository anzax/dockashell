import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { getContainerState } from './docker-utils.js';

export async function getProjectsStatus(projectManager) {
  const projects = await projectManager.listProjects();
  const results = [];
  for (const project of projects) {
    const state = await getContainerState(`dockashell-${project.name}`);
    let status = 'missing';
    if (state.exists) {
      status = state.running ? 'running' : 'stopped';
    }
    results.push({ ...project, state: status });
  }
  return results;
}

export async function createDefaultConfig(projectName) {
  const dir = path.join(os.homedir(), 'projects', projectName);
  const config = {
    name: projectName,
    mounts: [
      {
        host: `~/projects/${projectName}`,
        container: '/workspace',
        readonly: false,
      },
    ],
    ports: [],
    environment: {},
    working_dir: '/workspace',
    shell: '/bin/bash',
    security: { max_execution_time: 300 },
  };
  await fs.ensureDir(dir);
  return config;
}
