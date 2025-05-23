import { jest } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { readLogEntries } from '../src/tui/read-logs.js';

describe('TUI Integration Tests', () => {
  let tmpDir;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dockashell-test-'));
    
    // Mock os.homedir to return our temp directory
    jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(tmpDir);
    jest.restoreAllMocks();
  });

  test('readLogEntries works with real filesystem', async () => {
    // Create the logs directory structure
    const logsDir = path.join(tmpDir, '.dockashell', 'logs');
    await fs.ensureDir(logsDir);

    // Create a test log file
    const logFile = path.join(logsDir, 'test-project.jsonl');
    const logContent = [
      '{"timestamp":"2025-05-23T10:00:00Z","kind":"note","noteType":"user","text":"Create app"}',
      '{"timestamp":"2025-05-23T10:00:05Z","kind":"note","noteType":"agent","text":"Planning implementation"}',
      '{"timestamp":"2025-05-23T10:00:10Z","kind":"command","command":"npm test","result":{"exitCode":0,"duration":"2.1s"}}'
    ].join('\n');
    
    await fs.writeFile(logFile, logContent);

    // Test readLogEntries
    const entries = await readLogEntries('test-project', 100);

    expect(entries).toHaveLength(3);
    // Should be in reverse order (newest first)
    expect(entries[0].kind).toBe('command');
    expect(entries[0].command).toBe('npm test');
    expect(entries[1].noteType).toBe('agent');
    expect(entries[1].text).toBe('Planning implementation');
    expect(entries[2].noteType).toBe('user');
    expect(entries[2].text).toBe('Create app');
  });

  test('readLogEntries respects maxEntries limit', async () => {
    const logsDir = path.join(tmpDir, '.dockashell', 'logs');
    await fs.ensureDir(logsDir);

    const logFile = path.join(logsDir, 'large-project.jsonl');
    const logContent = Array.from({ length: 10 }, (_, i) => 
      `{"timestamp":"2025-05-23T10:00:${i.toString().padStart(2, '0')}Z","kind":"note","text":"Entry ${i}"}`
    ).join('\n');
    
    await fs.writeFile(logFile, logContent);

    const entries = await readLogEntries('large-project', 3);

    expect(entries).toHaveLength(3);
    // Should get last 3 entries in reverse order
    expect(entries[0].text).toBe('Entry 9');
    expect(entries[1].text).toBe('Entry 8');
    expect(entries[2].text).toBe('Entry 7');
  });

  test('readLogEntries throws error for nonexistent project', async () => {
    const logsDir = path.join(tmpDir, '.dockashell', 'logs');
    await fs.ensureDir(logsDir);

    await expect(readLogEntries('nonexistent-project'))
      .rejects.toThrow("Log file not found for project 'nonexistent-project'");
  });

  test('readLogEntries handles malformed JSON gracefully', async () => {
    const logsDir = path.join(tmpDir, '.dockashell', 'logs');
    await fs.ensureDir(logsDir);

    const logFile = path.join(logsDir, 'mixed-project.jsonl');
    const logContent = [
      '{"timestamp":"2025-05-23T10:00:00Z","kind":"note","text":"Valid entry 1"}',
      'invalid json line',
      '{"timestamp":"2025-05-23T10:00:05Z","kind":"note","text":"Valid entry 2"}',
      'another invalid line',
      '{"timestamp":"2025-05-23T10:00:10Z","kind":"note","text":"Valid entry 3"}'
    ].join('\n');
    
    await fs.writeFile(logFile, logContent);

    const entries = await readLogEntries('mixed-project', 100);

    // Should only return valid JSON entries
    expect(entries).toHaveLength(3);
    expect(entries[0].text).toBe('Valid entry 3');
    expect(entries[1].text).toBe('Valid entry 2');
    expect(entries[2].text).toBe('Valid entry 1');
  });

  test('readLogEntries handles empty files', async () => {
    const logsDir = path.join(tmpDir, '.dockashell', 'logs');
    await fs.ensureDir(logsDir);

    const logFile = path.join(logsDir, 'empty-project.jsonl');
    await fs.writeFile(logFile, '');

    const entries = await readLogEntries('empty-project', 100);

    expect(entries).toHaveLength(0);
  });
});
