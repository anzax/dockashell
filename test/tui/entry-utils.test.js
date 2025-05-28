import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  buildEntryLines,
  formatTimestamp,
  prepareEntry,
  detectTraceType,
} from '../../src/tui/utils/entry-utils.js';

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

describe('buildEntryLines', () => {
  test('compact command without output', () => {
    const lines = buildEntryLines(sampleCommand, true, 80);
    assert.strictEqual(lines[0].type, 'header');
    assert.strictEqual(lines[1].type, 'command');
  });

  test('full command with output', () => {
    const lines = buildEntryLines(sampleCommand, false, 80);
    assert(lines.some((l) => l.type === 'output'));
  });
});

describe('formatTimestamp', () => {
  test('handles invalid timestamp', () => {
    assert.strictEqual(formatTimestamp('invalid'), 'Invalid timestamp');
    assert.strictEqual(formatTimestamp(null), 'No timestamp');
  });
});

describe('prepareEntry', () => {
  test('creates list and detail views', () => {
    const prepared = prepareEntry(sampleCommand, 10, 80);
    assert.strictEqual(prepared.lines.length, 2);
    assert(prepared.fullLines.length > 2);
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
