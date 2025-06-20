import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import Logger from '../../src/utils/logger.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Logger', () => {
  let logger;
  let tmpHome;
  let oldHome;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'ds-home-'));
    oldHome = process.env.HOME;
    process.env.HOME = tmpHome;
    logger = new Logger();
  });

  afterEach(async () => {
    process.env.HOME = oldHome;
    if (tmpHome) {
      await fs.remove(tmpHome);
    }
  });

  test('should initialize successfully', () => {
    assert.ok(logger instanceof Logger);
  });

  test('should log commands', async () => {
    const result = {
      type: 'exec',
      exitCode: 0,
      duration: '1.2s',
    };

    await logger.logCommand('test-project', 'ls -la', result);

    const traceFile = path.join(
      tmpHome,
      '.dockashell',
      'projects',
      'test-project',
      'traces',
      'current.jsonl'
    );
    const content = await fs.readFile(traceFile, 'utf8');
    assert.ok(content.includes('ls -la'));
    assert.ok(content.includes('exitCode'));
  });

  test('should log notes', async () => {
    await logger.logNote('test-project', 'user', 'Test note message');

    const traceFile = path.join(
      tmpHome,
      '.dockashell',
      'projects',
      'test-project',
      'traces',
      'current.jsonl'
    );
    const content = await fs.readFile(traceFile, 'utf8');
    assert.ok(content.includes('Test note message'));
    assert.ok(content.includes('"type":"user"'));
  });

  test('should read traces', async () => {
    await logger.logNote('test-project', 'agent', 'First entry');
    await logger.logNote('test-project', 'user', 'Second entry');

    const entries = await logger.readTraces('test-project', { limit: 10 });
    const texts = entries.map((e) => e.text).filter(Boolean);
    assert.ok(texts.includes('First entry'));
    assert.ok(texts.includes('Second entry'));
  });

  test('should log apply_patch traces', async () => {
    const diff = 'diff --git a/a b/a\n--- a/a\n+++ b/a\n@@\n-test\n+test2';
    await logger.logToolExecution(
      'test-project',
      'apply_patch',
      { patch: diff },
      {
        exitCode: 1,
        duration: '0.2s',
        output: 'error message',
      }
    );

    const entries = await logger.readTraces('test-project', {
      type: 'apply_patch',
      limit: 5,
    });
    assert.strictEqual(entries.length, 1);
    assert.ok(entries[0].patch.startsWith('diff --git'));
    assert.strictEqual(entries[0].result.exitCode, 1);
  });

  test('should log write_file traces', async () => {
    await logger.logToolExecution(
      'test-project',
      'write_file',
      { path: 'foo.txt', overwrite: true },
      { exitCode: 0, duration: '0.1s', output: '' }
    );

    const entries = await logger.readTraces('test-project', {
      type: 'write_file',
      limit: 5,
    });
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].path, 'foo.txt');
    assert.strictEqual(entries[0].result.exitCode, 0);
  });

  test('truncates command output based on config', async () => {
    const customLogger = new Logger();
    customLogger._config = {
      logging: { traces: { max_output_length: 10 } },
    };

    const result = {
      type: 'exec',
      exitCode: 0,
      duration: '0.1s',
      output: 'abcdefghijklmnopqrstuvwxyz',
    };

    await customLogger.logCommand('proj', 'cmd', result);

    const traceFile = path.join(
      tmpHome,
      '.dockashell',
      'projects',
      'proj',
      'traces',
      'current.jsonl'
    );
    const entry = JSON.parse((await fs.readFile(traceFile, 'utf8')).trim());
    assert.strictEqual(entry.result.output, 'abcdefghij[truncated]');
  });
});
