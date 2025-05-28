import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  buildEntryLines,
  formatTimestamp,
  prepareEntry,
  detectTraceType,
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

describe('buildEntryLines', () => {
  test('compact command without output', () => {
    const lines = buildEntryLines(sampleCommand, true, 80);
    assert.strictEqual(lines[0].type, 'text');
    assert.strictEqual(lines[1].type, 'text');
    assert(lines[0].bold); // header should be bold
    assert(lines[0].icon); // header should have icon
  });

  test('full command with output', () => {
    const lines = buildEntryLines(sampleCommand, false, 80);
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

describe('prepareEntry', () => {
  test('creates list and detail views', () => {
    const prepared = prepareEntry(sampleCommand, 80);
    assert.strictEqual(prepared.lines.length, 2);
    // Full lines are now generated on-demand in TraceDetailsView, not pre-computed
    assert(prepared.entry);
    assert(prepared.height);
    assert(prepared.traceType);
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
