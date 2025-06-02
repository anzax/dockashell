import { test } from 'node:test';
import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'path';

const cliPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src/cli/cli.js'
);

function run(args) {
  return new Promise((resolve) => {
    execFile(
      'node',
      [cliPath, ...args],
      { env: { ...process.env, DS_SKIP_TUI: '1' } },
      (err, stdout, stderr) => {
        resolve({ code: err && err.code ? err.code : 0, stdout, stderr });
      }
    );
  });
}

test('logs accepts optional project argument', async () => {
  const result = await run(['logs', 'myproj']);
  assert.strictEqual(result.code, 0);
  assert.ok(!result.stderr.includes('too many arguments'));
});

test('logs without argument opens selector', async () => {
  const result = await run(['logs']);
  assert.strictEqual(result.code, 0);
});
