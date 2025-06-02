import { test } from 'node:test';
import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';

const cliPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src/cli/cli.js'
);

function run(args, env = {}) {
  return new Promise((resolve) => {
    execFile(
      'node',
      [cliPath, ...args],
      { env: { ...process.env, ...env } },
      (err, stdout) => {
        resolve({ code: err && err.code ? err.code : 0, stdout });
      }
    );
  });
}

test('shows version', async () => {
  const result = await run(['--version']);
  assert.strictEqual(result.stdout.trim(), '0.1.0');
});

test('shows help', async () => {
  const result = await run(['help']);
  assert.ok(result.stdout.includes('Usage'));
});

test('auto-creates config structure on first use', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ds-home-'));
  const env = { HOME: tmpDir };
  await run(['status', '--json'], env);

  const base = path.join(tmpDir, '.dockashell');
  assert.ok(await fs.pathExists(path.join(base, 'config.json')));
  assert.ok(await fs.pathExists(path.join(base, 'projects')));
  assert.ok(await fs.pathExists(path.join(base, 'logs')));
  await fs.remove(tmpDir);
});
