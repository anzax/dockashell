import { test, describe } from 'node:test';
import assert from 'node:assert';
import { findClosestTimestamp } from '../src/tui/entry-utils.js';

describe('findClosestTimestamp', () => {
  test('finds exact timestamp match', () => {
    const entries = [
      { entry: { timestamp: '2024-01-01T10:00:00Z' } },
      { entry: { timestamp: '2024-01-01T11:00:00Z' } },
      { entry: { timestamp: '2024-01-01T12:00:00Z' } },
    ];

    const result = findClosestTimestamp(entries, '2024-01-01T11:00:00Z');
    assert.strictEqual(result, 1);
  });

  test('finds closest timestamp when exact match not found', () => {
    const entries = [
      { entry: { timestamp: '2024-01-01T10:00:00Z' } },
      { entry: { timestamp: '2024-01-01T12:00:00Z' } },
      { entry: { timestamp: '2024-01-01T14:00:00Z' } },
    ];

    // 11:30 is closer to 12:00 than 10:00
    const result = findClosestTimestamp(entries, '2024-01-01T11:30:00Z');
    assert.strictEqual(result, 1);

    // 10:30 is closer to 10:00 than 12:00
    const result2 = findClosestTimestamp(entries, '2024-01-01T10:30:00Z');
    assert.strictEqual(result2, 0);
  });

  test('handles empty entries array', () => {
    const result = findClosestTimestamp([], '2024-01-01T11:00:00Z');
    assert.strictEqual(result, -1);
  });

  test('handles null/undefined inputs', () => {
    const entries = [{ entry: { timestamp: '2024-01-01T10:00:00Z' } }];

    assert.strictEqual(findClosestTimestamp(null, '2024-01-01T11:00:00Z'), -1);
    assert.strictEqual(findClosestTimestamp(entries, null), -1);
    assert.strictEqual(findClosestTimestamp(entries, undefined), -1);
  });

  test('handles invalid timestamp formats', () => {
    const entries = [
      { entry: { timestamp: '2024-01-01T10:00:00Z' } },
      { entry: { timestamp: 'invalid-timestamp' } },
      { entry: { timestamp: '2024-01-01T12:00:00Z' } },
    ];

    const result = findClosestTimestamp(entries, '2024-01-01T11:00:00Z');
    // Should find index 0 (10:00) as first closest valid timestamp (tie-breaking favors first match)
    assert.strictEqual(result, 0);
  });

  test('handles single entry', () => {
    const entries = [{ entry: { timestamp: '2024-01-01T10:00:00Z' } }];

    const result = findClosestTimestamp(entries, '2024-01-01T15:00:00Z');
    assert.strictEqual(result, 0);
  });
});
