import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { getContainerState } from './docker-utils.js';
import { DEFAULT_PROJECT_CONFIG } from '../../utils/default-config.js';
import { loadConfig } from '../../utils/config.js';

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
  const globalConfig = await loadConfig();
  const projectsDir = globalConfig.projects.directory.replace(
    '~',
    os.homedir()
  );
  const dir = path.join(projectsDir, projectName);
  const config = {
    ...DEFAULT_PROJECT_CONFIG,
    name: projectName,
    mounts: DEFAULT_PROJECT_CONFIG.mounts.map((m) => ({
      ...m,
      host: m.host
        .replace('{projects_dir}', projectsDir)
        .replace('{name}', projectName),
    })),
  };
  await fs.ensureDir(dir);
  return config;
}
