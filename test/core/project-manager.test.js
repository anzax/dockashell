import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import ProjectManager from '../../src/core/project-manager.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('ProjectManager', () => {
  let projectManager;
  let testConfigDir;

  beforeEach(async () => {
    testConfigDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'dockashell-test-')
    );
    projectManager = new ProjectManager();
    projectManager.configDir = testConfigDir;
    projectManager.projectsDir = path.join(testConfigDir, 'projects');
    await projectManager.initialize();
  });

  afterEach(async () => {
    if (testConfigDir) {
      await fs.remove(testConfigDir);
    }
  });

  test('should initialize successfully', () => {
    assert.ok(projectManager instanceof ProjectManager);
  });

  test('should list projects', async () => {
    // Create a test project with proper structure: projects/test-project/config.json
    const projectDir = path.join(testConfigDir, 'projects', 'test-project');
    await fs.ensureDir(projectDir);
    await fs.writeJson(path.join(projectDir, 'config.json'), {
      name: 'test-project',
      image: 'ubuntu:latest',
      description: 'Test project',
    });

    const projects = await projectManager.listProjects();
    assert.ok(Array.isArray(projects));
    assert.ok(projects.length > 0);

    const testProject = projects.find((p) => p.name === 'test-project');
    assert.ok(testProject, 'Should find test-project in list');
    assert.strictEqual(testProject.name, 'test-project');
    assert.strictEqual(testProject.image, 'ubuntu:latest');
    assert.strictEqual(testProject.description, 'Test project');
  });

  test('should load project configuration', async () => {
    // Create a test project config in proper structure
    const projectDir = path.join(testConfigDir, 'projects', 'test-project');
    await fs.ensureDir(projectDir);
    const config = {
      name: 'test-project',
      image: 'node:18',
      workingDir: '/workspace',
      description: 'Test Node.js project',
    };
    await fs.writeJson(path.join(projectDir, 'config.json'), config);

    const loadedConfig = await projectManager.loadProject('test-project');

    // Check the key properties we care about
    assert.strictEqual(loadedConfig.name, 'test-project');
    assert.strictEqual(loadedConfig.image, 'node:18');
    assert.strictEqual(loadedConfig.description, 'Test Node.js project');
    assert.strictEqual(loadedConfig.working_dir, '/workspace');

    // Verify that defaults are applied
    assert.ok(Array.isArray(loadedConfig.mounts));
    assert.ok(Array.isArray(loadedConfig.ports));
    assert.ok(typeof loadedConfig.environment === 'object');
    assert.ok(typeof loadedConfig.security === 'object');
    assert.strictEqual(loadedConfig.shell, '/bin/bash');

    // Verify security defaults
    assert.strictEqual(loadedConfig.security.max_execution_time, 300);
  });

  test('should throw error for missing project', async () => {
    await assert.rejects(
      async () => await projectManager.loadProject('nonexistent'),
      /Project 'nonexistent' not found/
    );
  });

  test('should handle invalid project names', async () => {
    await assert.rejects(
      async () => await projectManager.loadProject(''),
      /Project name must be a non-empty string/
    );

    await assert.rejects(
      async () => await projectManager.loadProject('../../malicious'),
      /can only contain letters/
    );

    await assert.rejects(
      async () => await projectManager.loadProject('project with spaces'),
      /can only contain letters/
    );
  });

  test('should return empty list when no projects exist', async () => {
    const projects = await projectManager.listProjects();
    assert.ok(Array.isArray(projects));
    assert.strictEqual(projects.length, 0);
  });

  test('should ignore invalid config files', async () => {
    // Create a valid project
    const validProjectDir = path.join(
      testConfigDir,
      'projects',
      'valid-project'
    );
    await fs.ensureDir(validProjectDir);
    await fs.writeJson(path.join(validProjectDir, 'config.json'), {
      name: 'valid-project',
      image: 'ubuntu:latest',
    });

    // Create a directory with invalid config
    const invalidProjectDir = path.join(
      testConfigDir,
      'projects',
      'invalid-project'
    );
    await fs.ensureDir(invalidProjectDir);
    await fs.writeFile(
      path.join(invalidProjectDir, 'config.json'),
      'invalid json{'
    );

    // Should only return the valid project
    const projects = await projectManager.listProjects();
    assert.strictEqual(projects.length, 1);
    assert.strictEqual(projects[0].name, 'valid-project');
  });
});
