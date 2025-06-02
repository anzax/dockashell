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

test('start command validates project name', async () => {
  const result = await run(['start', 'Invalid-Name!']);
  assert.strictEqual(result.code, 1);
  assert.ok(result.stderr.includes('lowercase letters'));
});

test('create command rejects reserved names', async () => {
  const result = await run(['create', 'docker']);
  assert.strictEqual(result.code, 1);
  assert.ok(result.stderr.includes('reserved name'));
});

test('recreate command requires confirmation', async () => {
  const result = await run(['recreate', 'proj'], { DS_AUTO_CONFIRM: '1' });
  assert.strictEqual(result.code, 0);
  assert.ok(result.stdout.includes('Operation cancelled'));
});
