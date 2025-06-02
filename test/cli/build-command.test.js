import { test } from 'node:test';
import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'path';

const cliPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src/cli/cli.js'
);

function run(args, env = {}) {
  return new Promise((resolve) => {
    execFile(
      'node',
      [cliPath, ...args],
      { env: { ...process.env, DS_TEST_DOCKER: '1', ...env } },
      (err, stdout, stderr) => {
        resolve({ code: err && err.code ? err.code : 0, stdout, stderr });
      }
    );
  });
}

test('build command rejects quiet flag', async () => {
  const result = await run(['build', '--quiet']);
  assert.notStrictEqual(result.code, 0);
  assert.ok(result.stderr.includes('unknown option'));
});

test('build command shows cancellation for force rebuild', async () => {
  const result = await run(['build', '--force'], { DS_AUTO_CONFIRM: '1' });
  assert.strictEqual(result.code, 0);
  assert.ok(result.stdout.includes('Build cancelled'));
});
