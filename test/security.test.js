import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SecurityManager } from '../src/security.js';

describe('SecurityManager', () => {
  let securityManager;

  beforeEach(() => {
    securityManager = new SecurityManager();
  });

  test('should initialize successfully', () => {
    assert.ok(securityManager instanceof SecurityManager);
  });

  test('should validate safe commands with project config', () => {
    const projectConfig = {
      name: 'test-project',
      security: {},
    };
    const safeCommands = [
      'ls -la',
      'npm install',
      'node index.js',
      'git status',
      'mkdir test',
    ];

    safeCommands.forEach((cmd) => {
      assert.doesNotThrow(() =>
        securityManager.validateCommand(cmd, projectConfig)
      );
    });
  });

  test('should require project config', () => {
    assert.throws(
      () => securityManager.validateCommand('ls'),
      /Invalid project configuration/
    );
    assert.throws(
      () => securityManager.validateCommand('ls', null),
      /Invalid project configuration/
    );
  });

  test('should get max execution time', () => {
    const projectConfig = { name: 'test-project' };
    const maxTime = securityManager.getMaxExecutionTime(projectConfig);
    assert.ok(typeof maxTime === 'number');
    assert.ok(maxTime > 0);
  });

  test('should use custom max execution time from config', () => {
    const projectConfig = {
      name: 'test-project',
      security: { max_execution_time: 600 },
    };
    const maxTime = securityManager.getMaxExecutionTime(projectConfig);
    assert.strictEqual(maxTime, 600);
  });

  test('should validate command structure and format', () => {
    const projectConfig = { name: 'test-project' };

    // Should handle empty strings
    assert.throws(
      () => securityManager.validateCommand('', projectConfig),
      /Invalid command: must be a non-empty string/
    );

    // Should handle whitespace-only commands
    assert.throws(
      () => securityManager.validateCommand('   ', projectConfig),
      /Invalid command: must be a non-empty string/
    );

    // Should allow normal commands
    assert.doesNotThrow(() =>
      securityManager.validateCommand('echo hello', projectConfig)
    );
  });

  test('should return default security settings', () => {
    const defaults = securityManager.getDefaultSecuritySettings();
    assert.deepStrictEqual(defaults, {
      max_execution_time: 300,
    });
  });
});
