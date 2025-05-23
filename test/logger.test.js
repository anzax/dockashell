import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { Logger } from '../src/logger.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Logger', () => {
  let logger;
  let testLogDir;
  
  beforeEach(async () => {
    testLogDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dockashell-test-'));
    logger = new Logger();
    logger.logDir = testLogDir;
  });

  afterEach(async () => {
    if (testLogDir) {
      await fs.remove(testLogDir);
    }
  });

  test('should initialize successfully', () => {
    assert.ok(logger instanceof Logger);
    assert.ok(typeof logger.logDir === 'string');
  });

  test('should log commands', async () => {
    const result = {
      type: 'exec',
      exitCode: 0,
      duration: '1.2s'
    };

    await logger.logCommand('test-project', 'ls -la', result);
    
    const logFile = path.join(testLogDir, 'test-project.log');
    assert.ok(await fs.pathExists(logFile));
    
    const content = await fs.readFile(logFile, 'utf8');
    assert.ok(content.includes('test-project'));
    assert.ok(content.includes('ls -la'));
    assert.ok(content.includes('exit_code=0'));
  });

  test('should log notes', async () => {
    await logger.logNote('test-project', 'user', 'Test note message');
    
    const logFile = path.join(testLogDir, 'test-project.log');
    assert.ok(await fs.pathExists(logFile));
    
    const content = await fs.readFile(logFile, 'utf8');
    assert.ok(content.includes('Test note message'));
    assert.ok(content.includes('type=user'));
  });

  test('should read project logs', async () => {
    await logger.logNote('test-project', 'agent', 'First entry');
    await logger.logNote('test-project', 'user', 'Second entry');
    
    const logs = await logger.getProjectLogs('test-project');
    assert.ok(logs.includes('First entry'));
    assert.ok(logs.includes('Second entry'));
  });
});
