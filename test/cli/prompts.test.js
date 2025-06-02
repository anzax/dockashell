import { test } from 'node:test';
import assert from 'node:assert';
import { confirm } from '../../src/cli/utils/prompts.js';

test('confirm respects DS_AUTO_CONFIRM environment variable', async () => {
  process.env.DS_AUTO_CONFIRM = '1';
  const result = await confirm('Test?', true);
  assert.strictEqual(result, true);
  delete process.env.DS_AUTO_CONFIRM;
});
