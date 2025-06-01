import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  parseTraceLine,
  parseTraceLines,
} from '../../src/utils/trace-utils.js';

describe('trace-utils', () => {
  test('parseTraceLine handles known tools', () => {
    const bashLine = JSON.stringify({
      timestamp: '2025-01-01T00:00:00Z',
      tool: 'bash',
      command: 'echo hi',
      result: { exitCode: 0 },
    });
    const bash = parseTraceLine(bashLine);
    assert.deepStrictEqual(bash, {
      timestamp: '2025-01-01T00:00:00Z',
      kind: 'command',
      command: 'echo hi',
      result: { exitCode: 0 },
    });

    const legacyLine = JSON.stringify({
      timestamp: '2025-01-01T00:00:00Z',
      tool: 'run_command',
      command: 'echo hi',
      result: { exitCode: 0 },
    });
    const legacy = parseTraceLine(legacyLine);
    assert.deepStrictEqual(legacy, bash);

    const patchLine = JSON.stringify({
      timestamp: '2025-01-01T00:00:01Z',
      tool: 'apply_patch',
      patch: 'diff',
      result: { exitCode: 1 },
    });
    const patch = parseTraceLine(patchLine);
    assert.deepStrictEqual(patch, {
      timestamp: '2025-01-01T00:00:01Z',
      kind: 'apply_patch',
      patch: 'diff',
      result: { exitCode: 1 },
    });
  });

  test('parseTraceLines filters malformed input', () => {
    const lines = [
      JSON.stringify({
        timestamp: 1,
        tool: 'write_trace',
        type: 'user',
        text: 'hi',
      }),
      'not-json',
      JSON.stringify({
        timestamp: 2,
        tool: 'write_file',
        path: 'f',
        overwrite: true,
      }),
    ];
    const parsed = parseTraceLines(lines);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].kind, 'note');
    assert.strictEqual(parsed[1].kind, 'write_file');
  });
});
