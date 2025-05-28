import { test, describe } from 'node:test';
import assert from 'node:assert';
import { sanitizeText } from '../../src/tui/ui-utils/line-formatter.js';

describe('sanitizeText', () => {
  test('replaces tabs with spaces', () => {
    const input = 'hello\tworld\ttabs';
    const expected = 'hello  world  tabs';
    assert.strictEqual(sanitizeText(input), expected);
  });

  test('removes ANSI escape sequences', () => {
    const input = 'hello \x1b[31mred text\x1b[0m world';
    const expected = 'hello red text world';
    assert.strictEqual(sanitizeText(input), expected);
  });

  test('replaces control characters with spaces', () => {
    const input = 'hello\x01\x02world\x7f';
    const expected = 'hello  world ';
    assert.strictEqual(sanitizeText(input), expected);
  });

  test('preserves newlines', () => {
    const input = 'line1\nline2\nline3';
    const expected = 'line1\nline2\nline3';
    assert.strictEqual(sanitizeText(input), expected);
  });

  test('handles JSON with tabs (package.json style)', () => {
    const input = '{\n\t"name": "test",\n\t"version": "1.0.0"\n}';
    const expected = '{\n  "name": "test",\n  "version": "1.0.0"\n}';
    assert.strictEqual(sanitizeText(input), expected);
  });

  test('preserves leading spaces', () => {
    const input = '  indented line\n    more indented';
    const expected = '  indented line\n    more indented';
    assert.strictEqual(sanitizeText(input), expected);
  });

  test('handles empty and null input', () => {
    assert.strictEqual(sanitizeText(''), '');
    assert.strictEqual(sanitizeText(null), '');
    assert.strictEqual(sanitizeText(undefined), '');
  });

  test('handles complex mixed problematic content', () => {
    const input =
      '\t{\n\t\t"exports":\x1b[31m {\n\t\t\t"types": "./build/index.d.ts",\x1b[0m\n\t\t\t"default": "./build/index.js"\n\t\t}\n\t}';
    const result = sanitizeText(input);
    // Should not contain tabs or ANSI codes
    assert.ok(!result.includes('\t'));
    assert.ok(!result.includes('\x1b'));
    // Should still be valid structure
    assert.ok(result.includes('"exports"'));
    assert.ok(result.includes('"types"'));
  });

  test('replaces problematic emojis with safe alternatives', () => {
    const input = 'Success: ✅ and Failure: ❌ status indicators';
    const expected = 'Success: [✓] and Failure: [✗] status indicators';
    assert.strictEqual(sanitizeText(input), expected);
  });

  test('preserves safe emojis', () => {
    const input = 'Other emojis like 🚀 and 📝 should be preserved';
    const expected = 'Other emojis like 🚀 and 📝 should be preserved';
    assert.strictEqual(sanitizeText(input), expected);
  });
});
