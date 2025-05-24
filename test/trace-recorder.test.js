import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { TraceRecorder } from '../src/trace-recorder.js';

describe('TraceRecorder', () => {
  let recorder;
  let tmpHome;
  let originalHome;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'dockashell-home-'));
    originalHome = process.env.HOME;
    process.env.HOME = tmpHome;
    recorder = new TraceRecorder('project1');
  });

  afterEach(async () => {
    process.env.HOME = originalHome;
    await fs.remove(tmpHome);
  });

  test('generates unique ids', () => {
    const a = recorder.generateTraceId();
    const b = recorder.generateTraceId();
    assert.notStrictEqual(a, b);
    assert.ok(recorder.sessionId.startsWith('ses_'));
  });

  test('writes JSONL format correctly', async () => {
    await recorder.trace('tool1', 'execution', { foo: 'bar' });
    const file = path.join(tmpHome, '.dockashell', 'projects', 'project1', 'traces', 'current.jsonl');
    const content = await fs.readFile(file, 'utf8');
    const obj = JSON.parse(content.trim());
    assert.strictEqual(obj.project_name, 'project1');
    assert.strictEqual(obj.tool, 'tool1');
    assert.strictEqual(obj.foo, 'bar');
  });

  test('validates required parameters', async () => {
    await assert.rejects(() => recorder.trace(null, 'x'), /required/);
    await assert.rejects(() => recorder.trace('tool', null), /required/);
  });
});
