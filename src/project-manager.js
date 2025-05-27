import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { defaultConfig } from './default-config.js';

export class ProjectManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.dockashell');
    this.projectsDir = path.join(this.configDir, 'projects');
  }

  /**
   * Get the default Docker image for new projects
   * @returns {string} Default Docker image name
   */
  getDefaultImage() {
    return 'dockashell/default-dev:latest';
  }

  async initialize() {
    await this.ensureConfigStructure();
  }

  async ensureConfigStructure() {
    await fs.ensureDir(this.configDir);
    await fs.ensureDir(this.projectsDir);
    await fs.ensureDir(path.join(this.configDir, 'logs'));

    // Create global config if it doesn't exist
    const globalConfigPath = path.join(this.configDir, 'config.json');
    if (!(await fs.pathExists(globalConfigPath))) {
      await fs.writeJSON(globalConfigPath, defaultConfig, { spaces: 2 });
    }
  }

  async listProjects() {
    try {
      await this.ensureConfigStructure();
      const projectDirs = await fs.readdir(this.projectsDir);
      const projects = [];

      for (const dir of projectDirs) {
        const projectPath = path.join(this.projectsDir, dir);
        const configPath = path.join(projectPath, 'config.json');

        if (await fs.pathExists(configPath)) {
          try {
            const config = await fs.readJSON(configPath);
            projects.push({
              name: config.name || dir,
              description: config.description || '',
              image: config.image || this.getDefaultImage(),
              status: 'configured',
            });
          } catch {
            // console.warn(`Failed to read config for project ${dir}:`, error.message);
          }
        }
      }

      return projects;
    } catch (error) {
      console.error('Failed to list projects:', error);
      return [];
    }
  }

  async loadProject(projectName) {
    this.validateProjectName(projectName);

    const projectPath = path.join(this.projectsDir, projectName);
    const configPath = path.join(projectPath, 'config.json');

    if (!(await fs.pathExists(configPath))) {
      throw new Error(
        `Project '${projectName}' not found. Config file missing: ${configPath}`
      );
    }

    try {
      const config = await fs.readJSON(configPath);

      // Validate config structure
      if (!config || typeof config !== 'object') {
        throw new Error(
          'Invalid configuration file: must be a valid JSON object'
        );
      }

      // Validate required fields
      if (!config.name) {
        config.name = projectName;
      }

      // Validate image field
      if (config.image && typeof config.image !== 'string') {
        throw new Error('Invalid configuration: image must be a string');
      }

      // Apply defaults
      const projectConfig = {
        name: projectName,
        description: config.description || '',
        image: config.image || this.getDefaultImage(),
        mounts: Array.isArray(config.mounts) ? config.mounts : [],
        ports: Array.isArray(config.ports) ? config.ports : [],
        environment:
          config.environment && typeof config.environment === 'object'
            ? config.environment
            : {},
        working_dir: config.working_dir || '/workspace',
        shell: config.shell || '/bin/bash',
        security: {
          max_execution_time:
            typeof config.security?.max_execution_time === 'number'
              ? config.security.max_execution_time
              : 300,
        },
        ...config,
      };

      // Parse devcontainer if specified
      if (config.devcontainer) {
        await this.parseDevcontainer(projectConfig);
      }

      return projectConfig;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Project configuration file not found: ${configPath}`);
      } else if (error.name === 'SyntaxError') {
        throw new Error(
          `Invalid JSON in project configuration: ${error.message}`
        );
      }
      throw new Error(
        `Failed to load project '${projectName}': ${error.message || error.toString() || 'Unknown error'}`
      );
    }
  }

  async parseDevcontainer(projectConfig) {
    try {
      if (!projectConfig.devcontainer) return;

      // Resolve devcontainer path relative to first mount point's host path
      let devcontainerPath = projectConfig.devcontainer;
      if (projectConfig.mounts && projectConfig.mounts.length > 0) {
        const hostPath = projectConfig.mounts[0].host.replace(
          '~',
          os.homedir()
        );
        devcontainerPath = path.resolve(hostPath, projectConfig.devcontainer);
      }

      if (await fs.pathExists(devcontainerPath)) {
        const devcontainer = await fs.readJSON(devcontainerPath);

        // Override config with devcontainer settings
        if (devcontainer.image) {
          projectConfig.image = devcontainer.image;
        }

        if (devcontainer.workspaceFolder) {
          projectConfig.working_dir = devcontainer.workspaceFolder;
        }

        if (devcontainer.containerEnv) {
          projectConfig.environment = {
            ...projectConfig.environment,
            ...devcontainer.containerEnv,
          };
        }

        if (devcontainer.forwardPorts) {
          // Add forwarded ports if not already configured
          const existingPorts = new Set(
            projectConfig.ports.map((p) => p.container)
          );
          devcontainer.forwardPorts.forEach((port) => {
            if (!existingPorts.has(port)) {
              projectConfig.ports.push({ host: port, container: port });
            }
          });
        }
      }
    } catch {
      // console.warn('Failed to parse devcontainer:', error.message);
    }
  }

  /**
   * Validate project name format
   * @param {string} name - Project name to validate
   * @throws {Error} If name is invalid
   */
  validateProjectName(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Project name must be a non-empty string');
    }
    if (name.length === 0) {
      throw new Error('Project name cannot be empty');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error(
        'Project name can only contain letters, numbers, hyphens, and underscores'
      );
    }
    if (name.length > 64) {
      throw new Error('Project name must be 64 characters or less');
    }
  }
}
