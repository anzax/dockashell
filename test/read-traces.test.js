import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  readTraceEntries,
  listSessions,
  getTraceFile,
} from '../src/tui/read-traces.js';

describe('read-traces helpers', () => {
  let tmpHome;
  let oldHome;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'ds-home-'));
    oldHome = process.env.HOME;
    process.env.HOME = tmpHome;
  });

  afterEach(async () => {
    process.env.HOME = oldHome;
    await fs.remove(tmpHome);
  });

  test('listSessions and readTraceEntries', async () => {
    const projDir = path.join(
      tmpHome,
      '.dockashell',
      'projects',
      'proj',
      'traces',
      'sessions'
    );
    await fs.ensureDir(projDir);
    const ses1 = path.join(projDir, 's1.jsonl');
    const ses2 = path.join(projDir, 's2.jsonl');
    await fs.writeFile(ses1, JSON.stringify({ timestamp: 1 }) + '\n');
    await fs.writeFile(ses2, JSON.stringify({ timestamp: 2 }) + '\n');
    await fs.utimes(
      ses1,
      new Date(Date.now() - 2000),
      new Date(Date.now() - 2000)
    );
    await fs.utimes(
      ses2,
      new Date(Date.now() - 1000),
      new Date(Date.now() - 1000)
    );
    const current = getTraceFile('proj', 'current');
    await fs.ensureDir(path.dirname(current));
    await fs.writeFile(current, JSON.stringify({ timestamp: 3 }) + '\n');

    const sessions = await listSessions('proj');
    assert.deepStrictEqual(sessions, ['s1', 's2', 'current']);

    const ses1Entries = await readTraceEntries('proj', 10, 's1');
    assert.strictEqual(ses1Entries.length, 1);

    const currentEntries = await readTraceEntries('proj', 10, 'current');
    assert.strictEqual(currentEntries.length, 1);
  });

  test('parses apply_diff entries', async () => {
    const current = getTraceFile('proj', 'current');
    await fs.ensureDir(path.dirname(current));
    const entry = {
      timestamp: new Date().toISOString(),
      tool: 'apply_diff',
      trace_type: 'execution',
      diff: 'diff --git a/a b/a',
      result: { exitCode: 0, duration: '0.1s' },
    };
    await fs.writeFile(current, JSON.stringify(entry) + '\n');

    const entries = await readTraceEntries('proj', 10, 'current');
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].kind, 'apply_diff');
    assert.strictEqual(entries[0].diff, 'diff --git a/a b/a');
    assert.strictEqual(entries[0].result.exitCode, 0);
  });
});
