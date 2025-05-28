import { describe, test } from 'node:test';
import assert from 'node:assert';
import { SHORTCUTS, buildFooter } from '../../src/tui/ui-utils/constants.js';

describe('buildFooter', () => {
  test('joins shortcuts with double spaces', () => {
    const out = buildFooter(SHORTCUTS.NAVIGATE, SHORTCUTS.QUIT);
    assert.strictEqual(out, '[↑↓] Navigate  [q] Quit');
  });
});
