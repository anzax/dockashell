import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  TextLayout,
  MIN_CONTENT_WIDTH,
  DEFAULT_MAX_SEPARATOR_WIDTH,
  ELLIPSIS_LENGTH,
} from '../../src/tui/ui-utils/text-utils.js';

describe('TextLayout', () => {
  test('content width uses minimum for very narrow terminals', () => {
    const layout = new TextLayout(20);
    assert.strictEqual(layout.contentWidth, MIN_CONTENT_WIDTH);
  });

  test('wrap returns empty array for empty text', () => {
    const layout = new TextLayout(80);
    assert.deepStrictEqual(layout.wrap(''), []);
  });

  test('truncate handles widths shorter than ellipsis', () => {
    const layout = new TextLayout(80);
    const result = layout.truncate('hello', ELLIPSIS_LENGTH - 1);
    assert.strictEqual(result, '.'.repeat(ELLIPSIS_LENGTH));
  });

  test('createSeparator caps length to default max', () => {
    const layout = new TextLayout(200);
    assert.strictEqual(
      layout.createSeparator().length,
      DEFAULT_MAX_SEPARATOR_WIDTH
    );
  });
});
