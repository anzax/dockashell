import { describe, test } from 'node:test';
import assert from 'node:assert';
import { sanitizeText } from '../../src/tui/ui-utils/line-formatter.js';
import { TextLayout, ELLIPSIS_LENGTH } from '../../src/tui/ui-utils/text-layout.js';

const layout = new TextLayout(80);

describe('TextLayout.wrap', () => {
  test('wraps long text to specified width', () => {
    const text = 'This is a very long line that needs to be wrapped because it exceeds the maximum width';
    const wrapped = layout.wrap(text, { width: 20 });
    assert.deepStrictEqual(wrapped, [
      'This is a very long',
      'line that needs to',
      'be wrapped because',
      'it exceeds the',
      'maximum width',
    ]);
  });

  test('handles words longer than width', () => {
    const text = 'short verylongwordthatexceedsthewidth end';
    const wrapped = layout.wrap(text, { width: 10 });
    assert.deepStrictEqual(wrapped, [
      'short',
      'verylongwo',
      'rdthatexce',
      'edsthewidt',
      'h end',
    ]);
  });

  test('handles empty text', () => {
    assert.deepStrictEqual(layout.wrap('', { width: 10 }), []);
    assert.deepStrictEqual(layout.wrap(null, { width: 10 }), []);
  });

  test('uses prefix for continuation lines', () => {
    const text = 'This is a line that needs wrapping';
    const wrapped = layout.wrap(text, { width: 15, prefix: '  ' });
    assert.deepStrictEqual(wrapped, [
      'This is a line',
      '  that needs',
      '  wrapping',
    ]);
  });
});

describe('TextLayout.truncate', () => {
  test('truncates text exceeding width', () => {
    assert.strictEqual(layout.truncate('This is a long text', 10), 'This is...');
    assert.strictEqual(layout.truncate('Short', 10), 'Short');
  });

  test('handles empty text', () => {
    assert.strictEqual(layout.truncate('', 10), '');
    assert.strictEqual(layout.truncate(null, 10), '');
  });

  test('handles width edge cases', () => {
    assert.strictEqual(layout.truncate('Test', 3), '.'.repeat(ELLIPSIS_LENGTH));
    assert.strictEqual(layout.truncate('Test', 4), 'T...');
  });
});

describe('sanitizeText helper', () => {
  test('replaces tabs with spaces and strips ANSI codes', () => {
    const input = 'hello\tworld\x1b[31m!\x1b[0m';
    assert.strictEqual(sanitizeText(input), 'hello  world!');
  });
});
