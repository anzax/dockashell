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
      { env: { ...process.env } },
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
