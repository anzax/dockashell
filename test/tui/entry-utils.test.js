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
    output:
      'total 42\ndrwxr-xr-x  2 user user 4096 Jan  1 12:00 .\ndrwxr-xr-x  3 user user 4096 Jan  1 11:00 ..',
  },
};

describe('buildEntryLines', () => {
  test('compact command without output', () => {
    const lines = buildEntryLines(sampleCommand, Infinity, 80, {
      showOutput: false,
      compact: true,
    });
    assert.strictEqual(lines[0].type, 'header');
    assert.strictEqual(lines[1].type, 'command');
    // Now exit code and duration are in the header typeText
    assert(lines[0].typeText.includes('Exit: 0'));
    assert(lines[0].typeText.includes('1s'));
    assert.strictEqual(lines.length, 2);
  });

  test('full command with output', () => {
    const lines = buildEntryLines(sampleCommand, Infinity, 80, {
      showOutput: true,
    });
    const types = lines.map((l) => l.type);
    // In full mode, we have header, command, separator, and output
    assert.strictEqual(types[0], 'header');
    assert.strictEqual(types[1], 'command');
    assert.strictEqual(types[2], 'separator');
    assert.strictEqual(types[3], 'output');
    assert.strictEqual(types.includes('output'), true);
  });

  test('truncates long commands in compact mode', () => {
    const longCommand = {
      ...sampleCommand,
      command: 'a'.repeat(100), // 100 character command
    };
    const lines = buildEntryLines(longCommand, Infinity, 80, {
      showOutput: false,
      compact: true,
    });
    assert.strictEqual(lines[1].type, 'command');
    assert(lines[1].text.includes('...'));
    // With terminal width 80, available width is ~70
    assert(lines[1].text.length <= 75);
  });

  test('shows full command in detail view', () => {
    const longCommand = {
      ...sampleCommand,
      command: 'a'.repeat(120), // very long command
    };
    const lines = buildEntryLines(longCommand, Infinity, 80, {
      showOutput: true,
      compact: false,
    });
    assert.strictEqual(lines[1].type, 'command');
    // Long commands should be wrapped in detail view
    assert(lines.filter((l) => l.type === 'command').length > 1);
  });

  test('handles multi-line commands', () => {
    const multilineCommand = {
      ...sampleCommand,
      command: 'cat > file.txt << EOF\nline 1\nline 2\nEOF',
    };
    const lines = buildEntryLines(multilineCommand, Infinity, 80, {
      showOutput: false,
      compact: true,
    });
    assert.strictEqual(lines[1].type, 'command');
    assert(lines[1].text.includes('... (4 lines)'));
  });

  test('formats note entries', () => {
    const note = {
      type: 'note',
      noteType: 'user',
      timestamp: '2024-01-01T12:00:00Z',
      text: 'This is a user note',
    };
    const lines = buildEntryLines(note, Infinity, 80, { compact: true });
    assert.strictEqual(lines[0].type, 'header');
    assert.strictEqual(lines[0].typeText, 'USER');
    assert.strictEqual(lines[1].type, 'content');
    assert.strictEqual(lines[1].text, 'This is a user note');
  });

  test('truncates long note text in compact mode', () => {
    const note = {
      type: 'note',
      noteType: 'agent',
      timestamp: '2024-01-01T12:00:00Z',
      text: 'a'.repeat(100),
    };
    const lines = buildEntryLines(note, Infinity, 80, { compact: true });
    assert.strictEqual(lines[1].type, 'content');
    assert(lines[1].text.includes('...'));
    assert(lines[1].text.length <= 75);
  });

  test('wraps long note text in detail view', () => {
    const note = {
      type: 'note',
      noteType: 'agent',
      timestamp: '2024-01-01T12:00:00Z',
      text: 'This is a very long note text that should be wrapped properly when displayed in detail view to ensure readability',
    };
    const lines = buildEntryLines(note, Infinity, 80, { compact: false });
    assert.strictEqual(lines[0].type, 'header');
    // Should have multiple content lines for wrapped text
    const contentLines = lines.filter((l) => l.type === 'content');
    assert(contentLines.length > 1);
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
    assert.strictEqual(prepared.height, 3); // Always 3 for list view
    assert.strictEqual(prepared.lines.length, 2); // Header + command
    assert(prepared.fullLines.length > 2); // Has output in detail view
    assert.strictEqual(prepared.traceType, 'command');
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

  test('edge cases and fallbacks', () => {
    assert.strictEqual(detectTraceType(), 'unknown');
    assert.strictEqual(detectTraceType(null), 'unknown');

    const noTypeNote = { kind: 'note' };
    assert.strictEqual(detectTraceType(noTypeNote), 'note');

    const legacy = { kind: 'misc', type: 'legacy' };
    assert.strictEqual(detectTraceType(legacy), 'legacy');

    const byProp = { patch: 'diff' };
    assert.strictEqual(detectTraceType(byProp), 'apply_patch');

    const customNote = { noteType: 'custom' };
    assert.strictEqual(detectTraceType(customNote), 'custom');
  });
});
