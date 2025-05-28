import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  wrapText,
  formatMultilineText,
  truncateText,
  formatCommandOutput,
} from '../../src/tui/ui-utils/line-formatter.js';

describe('wrapText', () => {
  test('wraps long text to specified width', () => {
    const text =
      'This is a very long line that needs to be wrapped because it exceeds the maximum width';
    const wrapped = wrapText(text, 20);
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
    const wrapped = wrapText(text, 10);
    assert.deepStrictEqual(wrapped, [
      'short',
      'verylongwo',
      'rdthatexce',
      'edsthewidt',
      'h end',
    ]);
  });

  test('handles empty text', () => {
    assert.deepStrictEqual(wrapText('', 10), []);
    assert.deepStrictEqual(wrapText(null, 10), []);
  });

  test('uses prefix for continuation lines', () => {
    const text = 'This is a line that needs wrapping';
    const wrapped = wrapText(text, 15, '  ');
    assert.deepStrictEqual(wrapped, [
      'This is a line',
      '  that needs',
      '  wrapping',
    ]);
  });
});

describe('formatMultilineText', () => {
  test('preserves line breaks by default', () => {
    const text = 'Line one\nLine two\nLine three';
    const formatted = formatMultilineText(text, 50);
    assert.deepStrictEqual(formatted, ['Line one', 'Line two', 'Line three']);
  });

  test('wraps long lines within multiline text', () => {
    const text =
      'Short line\nThis is a very long line that needs to be wrapped\nAnother short';
    const formatted = formatMultilineText(text, 20);
    assert.deepStrictEqual(formatted, [
      'Short line',
      'This is a very long',
      'line that needs to',
      'be wrapped',
      'Another short',
    ]);
  });

  test('respects maxLines limit', () => {
    const text = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
    const formatted = formatMultilineText(text, 50, 3);
    assert.deepStrictEqual(formatted, ['Line 1', 'Line 2', 'Line 3...']);
  });

  test('handles empty lines', () => {
    const text = 'Line 1\n\nLine 3';
    const formatted = formatMultilineText(text, 50);
    assert.deepStrictEqual(formatted, ['Line 1', '', 'Line 3']);
  });
});

describe('truncateText', () => {
  test('truncates text exceeding width', () => {
    assert.strictEqual(truncateText('This is a long text', 10), 'This is...');
    assert.strictEqual(truncateText('Short', 10), 'Short');
  });

  test('handles empty text', () => {
    assert.strictEqual(truncateText('', 10), '');
    assert.strictEqual(truncateText(null, 10), '');
  });

  test('handles width edge cases', () => {
    assert.strictEqual(truncateText('Test', 3), '...');
    assert.strictEqual(truncateText('Test', 4), 'T...');
  });
});

describe('formatCommandOutput', () => {
  test('preserves output lines', () => {
    const output = 'Line 1\nLine 2\nLine 3';
    const formatted = formatCommandOutput(output, 50);
    assert.deepStrictEqual(formatted, ['Line 1', 'Line 2', 'Line 3']);
  });

  test('wraps long output lines', () => {
    const output =
      'This is a very long output line that needs wrapping\nShort line';
    const formatted = formatCommandOutput(output, 20);
    assert.deepStrictEqual(formatted, [
      'This is a very long',
      '  output line that',
      '  needs wrapping',
      'Short line',
    ]);
  });

  test('preserves empty lines in output', () => {
    const output = 'Output 1\n\nOutput 3';
    const formatted = formatCommandOutput(output, 50);
    assert.deepStrictEqual(formatted, ['Output 1', '', 'Output 3']);
  });

  test('handles empty output', () => {
    assert.deepStrictEqual(formatCommandOutput('', 50), []);
    assert.deepStrictEqual(formatCommandOutput(null, 50), []);
    assert.deepStrictEqual(formatCommandOutput('   ', 50), []);
  });
});
