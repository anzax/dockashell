import { ProjectManager } from '../src/project-manager.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('ProjectManager', () => {
  let projectManager;
  let testConfigDir;
  
  beforeEach(async () => {
    projectManager = new ProjectManager();
    await projectManager.initialize();
    
    // Create test project structure
    testConfigDir = path.join(os.homedir(), '.dockashell', 'projects', 'test-jest-project');
    await fs.ensureDir(testConfigDir);
    
    const testConfig = {
      name: "test-jest-project",
      description: "Test project for Jest validation",
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

    await fs.writeJSON(path.join(testConfigDir, 'config.json'), testConfig, { spaces: 2 });
  });

  afterEach(async () => {
    // Clean up test project
    try {
      await fs.remove(testConfigDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should initialize successfully', () => {
    expect(projectManager).toBeDefined();
    expect(projectManager.configDir).toBeDefined();
  });

  test('should list projects', async () => {
    const projects = await projectManager.listProjects();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
    
    const testProject = projects.find(p => p.name === 'test-jest-project');
    expect(testProject).toBeDefined();
    expect(testProject.image).toBe('ubuntu:latest');
  });

  test('should load a project', async () => {
    const project = await projectManager.loadProject('test-jest-project');
    expect(project).toBeDefined();
    expect(project.name).toBe('test-jest-project');
    expect(project.image).toBe('ubuntu:latest');
    expect(project.working_dir).toBe('/workspace');
  });

  test('should reject empty project name', async () => {
    await expect(projectManager.loadProject('')).rejects.toThrow('Project name must be a non-empty string');
  });

  test('should reject invalid project name', async () => {
    await expect(projectManager.loadProject('invalid/path')).rejects.toThrow('Invalid project name');
  });

  test('should reject nonexistent project', async () => {
    await expect(projectManager.loadProject('nonexistent-project')).rejects.toThrow('not found');
  });

  test('should validate project name format', () => {
    expect(() => projectManager.validateProjectName('valid-name')).not.toThrow();
    expect(() => projectManager.validateProjectName('valid_name')).not.toThrow();
    expect(() => projectManager.validateProjectName('validname123')).not.toThrow();
    
    expect(() => projectManager.validateProjectName('')).toThrow();
    expect(() => projectManager.validateProjectName('invalid/name')).toThrow();
    expect(() => projectManager.validateProjectName('invalid name')).toThrow();
    expect(() => projectManager.validateProjectName('invalid.name')).toThrow();
  });
});
