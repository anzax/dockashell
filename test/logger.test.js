import { Logger } from '../src/logger.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Logger', () => {
  let logger;
  let testLogDir;
  
  beforeEach(async () => {
    logger = new Logger();
    testLogDir = path.join(os.homedir(), '.dockashell-test', 'logs');
    await fs.ensureDir(testLogDir);
    // Override the log directory for testing
    logger.logDir = testLogDir;
  });

  afterEach(async () => {
    // Clean up test logs
    try {
      await fs.remove(path.join(os.homedir(), '.dockashell-test'));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should initialize successfully', () => {
    expect(logger).toBeDefined();
    expect(logger.logDir).toBeDefined();
  });

  test('should log commands successfully', async () => {
    const projectName = 'test-project';
    const command = 'ls -la';
    const result = {
      type: 'exec',
      exitCode: 0,
      duration: '0.1s'
    };

    await logger.logCommand(projectName, command, result);

    const logFile = path.join(testLogDir, `${projectName}.log`);
    expect(await fs.pathExists(logFile)).toBe(true);

    const logContent = await fs.readFile(logFile, 'utf8');
    expect(logContent).toContain(command);
    expect(logContent).toContain('[EXEC]');
    expect(logContent).toContain('exit_code=0');
  });

  test('should handle different command types', async () => {
    const projectName = 'test-project';
    
    // Test START command
    await logger.logCommand(projectName, 'container start', {
      type: 'start',
      containerId: 'abc123',
      ports: '3000:3000'
    });

    // Test STOP command
    await logger.logCommand(projectName, 'container stop', {
      type: 'stop',
      containerId: 'abc123'
    });

    const logs = await logger.getProjectLogs(projectName);
    expect(logs).toContain('[START]');
    expect(logs).toContain('[STOP]');
    expect(logs).toContain('abc123');
  });

  test('should append to existing log files', async () => {
    const projectName = 'test-project';
    
    await logger.logCommand(projectName, 'first command', {
      type: 'exec',
      exitCode: 0
    });

    await logger.logCommand(projectName, 'second command', {
      type: 'exec',
      exitCode: 0
    });

    const logs = await logger.getProjectLogs(projectName);
    const lines = logs.trim().split('\n');
    expect(lines.length).toBe(2);
    expect(logs).toContain('first command');
    expect(logs).toContain('second command');
  });

  test('should handle projects with no logs', async () => {
    const logs = await logger.getProjectLogs('nonexistent-project');
    expect(logs).toBe('');
  });

  test('should create log directory if it does not exist', async () => {
    const newLogger = new Logger();
    const newLogDir = path.join(os.homedir(), '.dockashell-test-new', 'logs');
    newLogger.logsDir = newLogDir;

    await newLogger.logCommand('test-project', 'test command', {
      type: 'exec',
      exitCode: 0
    });

    expect(await fs.pathExists(newLogDir)).toBe(true);
    
    // Cleanup
    await fs.remove(path.join(os.homedir(), '.dockashell-test-new'));
  });

  test('should format log entries consistently', async () => {
    const projectName = 'test-project';
    const timestamp = new Date().toISOString();
    
    await logger.logCommand(projectName, 'test command', {
      type: 'exec',
      exitCode: 0,
      duration: '1.5s'
    });

    const logs = await logger.getProjectLogs(projectName);
    const logLine = logs.trim();
    
    // Check log format: timestamp [TYPE] project=name command="cmd" ...
    expect(logLine).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    expect(logLine).toContain('[EXEC]');
    expect(logLine).toContain('project=test-project');
    expect(logLine).toContain('command="test command"');
    expect(logLine).toContain('exit_code=0');
    expect(logLine).toContain('duration=1.5s');
  });

  test('should handle special characters in commands', async () => {
    const projectName = 'test-project';
    const complexCommand = 'echo "Hello World!" && ls -la | grep test';
    
    await logger.logCommand(projectName, complexCommand, {
      type: 'exec',
      exitCode: 0
    });

    const logs = await logger.getProjectLogs(projectName);
    expect(logs).toContain(complexCommand);
  });

  test('should handle logging errors gracefully', async () => {
    const invalidLogger = new Logger();
    invalidLogger.logDir = '/invalid/path/that/cannot/be/created';

    // Should not throw an error, but handle it gracefully
    await expect(invalidLogger.logCommand('test', 'command', { type: 'exec' }))
      .resolves.not.toThrow();
  });

  test('should log notes and read json logs', async () => {
    const projectName = 'test-project';
    await logger.logNote(projectName, 'user', 'remember this');
    await logger.logCommand(projectName, 'echo hi', { type: 'exec', exitCode: 0, output: 'hello world' });

    const jsonEntries = await logger.readJsonLogs(projectName);
    expect(jsonEntries.length).toBe(2);
    const kinds = jsonEntries.map(e => e.kind);
    expect(kinds).toContain('note');
    expect(kinds).toContain('command');

    const filtered = await logger.readJsonLogs(projectName, { type: 'note' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].noteType).toBe('user');
  });

  test('should include command output preview and search it', async () => {
    const projectName = 'output-project';
    await logger.logCommand(projectName, 'echo preview', { type: 'exec', exitCode: 0, output: 'preview text' });

    const entries = await logger.readJsonLogs(projectName);
    expect(entries[0].output).toBe('preview text');

    const searched = await logger.readJsonLogs(projectName, { search: 'preview' });
    expect(searched.length).toBe(1);
  });
});
