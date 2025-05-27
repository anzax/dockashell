import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { SystemLogger } from '../src/utils/system-logger.js';

describe('SystemLogger', () => {
  let tmpDir;
  let logger;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ds-syslog-'));
    logger = new SystemLogger();
    logger.logsDir = tmpDir;
    logger.logFile = path.join(tmpDir, 'system.log');
  });

  afterEach(async () => {
    if (tmpDir) {
      await fs.remove(tmpDir);
    }
  });

  test('writes log entries', async () => {
    await logger.info('hello world');
    const content = await fs.readFile(logger.logFile, 'utf8');
    assert.ok(content.includes('hello world'));
  });
});
