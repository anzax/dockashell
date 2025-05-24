import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { TraceRecorder } from '../src/trace-recorder.js';

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
    await recorder.execution('run_command', { command: 'echo hi' }, { exit: 0 });
    const fileExists = await fs.pathExists(recorder.currentFile);
    assert.ok(fileExists);
    await recorder.close();
    const sessionFile = path.join(recorder.sessionsDir, `${recorder.sessionId}.jsonl`);
    assert.ok(await fs.pathExists(sessionFile));
  });

  test('resumes active session on restart', async () => {
    await recorder.observation('user', 'note');
    const firstId = recorder.sessionId;

    const resumed = new TraceRecorder('proj');
    assert.strictEqual(resumed.sessionId, firstId);
  });

  test('rotates session after timeout', async () => {
    await recorder.observation('user', 'start');
    const firstId = recorder.sessionId;
    // Simulate 5 hours passing
    recorder.sessionStart = Date.now() - 5 * 60 * 60 * 1000;
    await recorder.observation('user', 'after timeout');
    const secondId = recorder.sessionId;
    assert.notStrictEqual(secondId, firstId);
  });
});
