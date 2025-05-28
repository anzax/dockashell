import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { TraceRecorder } from '../../src/utils/trace-recorder.js';

describe('TraceRecorder', () => {
  let tmpHome;
  let oldHome;
  let recorder;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'ds-home-'));
    oldHome = process.env.HOME;
    process.env.HOME = tmpHome;
    recorder = new TraceRecorder('proj');
  });

  afterEach(async () => {
    process.env.HOME = oldHome;
    if (tmpHome) {
      await fs.remove(tmpHome);
    }
  });

  test('generates unique session ids', () => {
    const id1 = recorder.generateSessionId();
    const id2 = recorder.generateSessionId();
    assert.ok(id1.startsWith('ses_'));
    assert.notStrictEqual(id1, id2);
  });

  test('writes trace entries and moves on close', async () => {
    await recorder.execution(
      'run_command',
      { command: 'echo hi' },
      { exit: 0 }
    );
    const fileExists = await fs.pathExists(recorder.currentFile);
    assert.ok(fileExists);
    await recorder.close();
    const files = await fs.readdir(recorder.sessionsDir);
    assert.strictEqual(files.length, 1);
  });

  test('rotates session after timeout', async () => {
    await recorder.observation('user', 'first');
    // simulate 5h later
    recorder.lastTraceTime -= 5 * 60 * 60 * 1000;
    await recorder.observation('user', 'second');
    const files = await fs.readdir(recorder.sessionsDir);
    assert.strictEqual(files.length, 1);
    const currentExists = await fs.pathExists(recorder.currentFile);
    assert.ok(currentExists);
  });
});
