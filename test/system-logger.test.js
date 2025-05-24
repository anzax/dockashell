import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { SystemLogger } from '../src/system-logger.js';

describe('SystemLogger', () => {
  let logger;
  let tmpHome;
  let originalHome;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'dockashell-home-'));
    originalHome = process.env.HOME;
    process.env.HOME = tmpHome;
    logger = new SystemLogger();
  });

  afterEach(async () => {
    process.env.HOME = originalHome;
    await fs.remove(tmpHome);
  });

  test('writes formatted entries to system.log', async () => {
    await logger.info('hello world');
    const logFile = path.join(tmpHome, '.dockashell', 'logs', 'system.log');
    assert.ok(await fs.pathExists(logFile));
    const content = await fs.readFile(logFile, 'utf8');
    assert.ok(content.includes('hello world'));
  });

  test('formats context objects correctly', async () => {
    await logger.debug('ctx', { foo: 'bar' });
    const logFile = path.join(tmpHome, '.dockashell', 'logs', 'system.log');
    const content = await fs.readFile(logFile, 'utf8');
    assert.ok(content.includes('"foo":"bar"'));
  });

  test('creates log directory if missing', async () => {
    const dir = path.join(tmpHome, '.dockashell', 'logs');
    await fs.remove(dir);
    await logger.info('check dir');
    assert.ok(await fs.pathExists(dir));
  });

  test('handles file write errors gracefully', async () => {
    const orig = fs.appendFile;
    let called = false;
    fs.appendFile = async () => { called = true; throw new Error('fail'); };
    await logger.info('will fail');
    fs.appendFile = orig;
    assert.ok(called); // if error thrown, test would fail
  });
});
