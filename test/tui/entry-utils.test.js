import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  buildCompactLines,
  buildFullLines,
} from '../../src/tui/components/TraceItemPreview.js';
import {
  formatTimestamp,
  detectTraceType,
  findClosestIndexByTimestamp,
} from '../../src/tui/ui-utils/entry-utils.js';

const sampleCommand = {
  kind: 'command',
  timestamp: '2024-01-01T12:00:00Z',
  command: 'ls -la',
  result: {
    exitCode: 0,
    duration: '1s',
    output: 'ok',
  },
};

describe('buildCompactLines', () => {
  test('compact command without output', () => {
    const lines = buildCompactLines(sampleCommand, 80);
    assert.strictEqual(lines[0].type, 'text');
    assert.strictEqual(lines[1].type, 'text');
    assert(lines[0].bold); // header should be bold
    assert(lines[0].icon); // header should have icon
  });
});

describe('buildFullLines', () => {
  test('full command with output', () => {
    const lines = buildFullLines(sampleCommand, 80);
    // All lines should be type 'text', but output lines should have specific formatting
    assert(lines.every((l) => l.type === 'text'));
    // Output lines should have 2-space prefix
    assert(lines.some((l) => l.text.startsWith('  ok')));
  });
});

describe('formatTimestamp', () => {
  test('handles invalid timestamp', () => {
    assert.strictEqual(formatTimestamp('invalid'), 'Invalid timestamp');
    assert.strictEqual(formatTimestamp(null), 'No timestamp');
  });
});

describe('detectTraceType', () => {
  test('handles various entry shapes', () => {
    const note = { kind: 'note', noteType: 'agent' };
    const patch = { kind: 'apply_patch', patch: 'patch' };
    const cmd = { kind: 'command', command: 'ls' };
    const write = { kind: 'write_file', path: 'f' };
    assert.strictEqual(detectTraceType(note), 'agent');
    assert.strictEqual(detectTraceType(patch), 'apply_patch');
    assert.strictEqual(detectTraceType(cmd), 'command');
    assert.strictEqual(detectTraceType(write), 'write_file');
  });
});

describe('findClosestIndexByTimestamp', () => {
  const entries = [
    { trace: { timestamp: '2025-01-01T00:00:00Z' } },
    { trace: { timestamp: '2025-01-01T00:01:00Z' } },
    { trace: { timestamp: '2025-01-01T00:02:00Z' } },
  ];

  test('finds exact and nearest match', () => {
    const exact = findClosestIndexByTimestamp(entries, '2025-01-01T00:01:00Z');
    assert.strictEqual(exact, 1);
    const near = findClosestIndexByTimestamp(entries, '2025-01-01T00:01:30Z');
    assert.strictEqual(near, 1);
  });

  test('handles empty list and invalid timestamp', () => {
    assert.strictEqual(findClosestIndexByTimestamp([], '2025'), -1);
    assert.strictEqual(findClosestIndexByTimestamp(entries, 'bad'), -1);
  });
});
