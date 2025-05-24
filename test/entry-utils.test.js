import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildEntryLines } from '../src/tui/entry-utils.js';

const sampleCommand = {
  kind: 'command',
  timestamp: '2024-01-01T00:00:00Z',
  command: 'echo hello',
  result: {
    exitCode: 0,
    duration: '1s',
    output: 'hello\n'
  }
};

describe('buildEntryLines', () => {
  test('compact command without output', () => {
    const lines = buildEntryLines(sampleCommand, Infinity, { showOutput: false, compact: true });
    assert.strictEqual(lines[0].type, 'header');
    assert.strictEqual(lines[1].type, 'command');
    assert.ok(lines[1].text.includes('exit 0'));
    assert.strictEqual(lines.length, 2);
  });

  test('full command with output', () => {
    const lines = buildEntryLines(sampleCommand, Infinity, { showOutput: true });
    const types = lines.map(l => l.type);
    assert.deepStrictEqual(types.slice(0,3), ['header','command','status']);
    assert.ok(types.includes('output'));
  });
});
