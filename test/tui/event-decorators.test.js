import { describe, test } from 'node:test';
import assert from 'node:assert';
import { getDecorator } from '../../src/tui/event-decorators/index.js';
import { TRACE_ICONS, TRACE_COLORS } from '../../src/tui/ui-utils/constants.js';
import { formatTimestamp } from '../../src/tui/ui-utils/entry-utils.js';

const timestamp = '2024-01-01T00:00:00Z';
const formatted = formatTimestamp(timestamp);
const width = 20;

describe('event decorators', () => {
  test('command decorator renders expected lines', () => {
    const entry = {
      kind: 'command',
      timestamp,
      command: 'echo hi',
      result: { exitCode: 0, output: 'ok' },
    };
    const deco = getDecorator('command');
    const header = deco.headerLine(entry);
    assert.strictEqual(
      header.text,
      `${formatted} [COMMAND exit:0 dur:N/A] [↑:1 ↓:1 lines]`
    );
    assert.strictEqual(header.icon, TRACE_ICONS.command);
    assert.strictEqual(header.color, 'white');
    assert(header.bold);

    const compact = deco.contentCompact(entry, width);
    assert.strictEqual(compact.text, '$ echo hi');
    assert.strictEqual(compact.color, 'gray');

    const full = deco.contentFull(entry, width);
    assert.strictEqual(full[0].text, '$ echo hi');
    assert(full.some((l) => l.text.trim() === 'ok'));
  });

  test('apply_patch decorator renders expected lines', () => {
    const entry = {
      kind: 'apply_patch',
      timestamp,
      patch: 'diff\nline2',
      result: { exitCode: 0, output: 'done' },
    };
    const deco = getDecorator('apply_patch');
    const header = deco.headerLine(entry);
    assert.strictEqual(
      header.text,
      `${formatted} [APPLY_PATCH exit:0 dur:N/A] [↑:2 ↓:1 lines]`
    );
    assert.strictEqual(header.icon, TRACE_ICONS.apply_patch);
    assert.strictEqual(header.color, TRACE_COLORS.apply_patch);

    const compact = deco.contentCompact(entry, width);
    assert.strictEqual(compact.text, 'diff');

    const full = deco.contentFull(entry, width);
    assert.strictEqual(full[0].text, 'diff');
    assert(full.some((l) => l.text.trim() === 'done'));
  });

  test('write_file decorator renders expected lines', () => {
    const entry = {
      kind: 'write_file',
      timestamp,
      path: '/tmp/a',
      content: 'hello',
      result: { exitCode: 0 },
    };
    const deco = getDecorator('write_file');
    const header = deco.headerLine(entry);
    assert.strictEqual(
      header.text,
      `${formatted} [WRITE_FILE exit:0 dur:N/A] [↑:1 ↓:0 lines]`
    );
    assert.strictEqual(header.icon, TRACE_ICONS.write_file);
    assert.strictEqual(header.color, TRACE_COLORS.write_file);

    const compact = deco.contentCompact(entry, width);
    assert.strictEqual(compact.text, '/tmp/a');

    const full = deco.contentFull(entry, width);
    assert.strictEqual(full[0].text, '/tmp/a');
    assert(full.some((l) => l.text.trim() === 'hello'));
  });

  ['user', 'agent', 'summary'].forEach((kind) => {
    test(`${kind} decorator renders expected lines`, () => {
      const entry = { kind, timestamp, text: `hello ${kind}` };
      const deco = getDecorator(kind);
      const header = deco.headerLine(entry);
      assert.strictEqual(header.text, `${formatted} [${kind.toUpperCase()}]`);
      assert.strictEqual(header.icon, TRACE_ICONS[kind]);
      assert.strictEqual(header.color, TRACE_COLORS[kind]);

      const compact = deco.contentCompact(entry, width);
      assert.strictEqual(compact.text, `hello ${kind}`);

      const full = deco.contentFull(entry, width);
      assert.deepStrictEqual(full, [
        { type: 'text', text: `hello ${kind}`, color: 'white' },
      ]);
    });
  });

  test('unknown decorator renders JSON lines', () => {
    const entry = { timestamp, other: 'value' };
    const deco = getDecorator('unknown');
    const header = deco.headerLine(entry);
    assert.strictEqual(header.text, `${formatted} [UNKNOWN]`);
    assert.strictEqual(header.icon, TRACE_ICONS.unknown);
    assert.strictEqual(header.color, 'gray');

    const compact = deco.contentCompact(entry, width);
    assert.ok(compact.text.startsWith('{'));

    const full = deco.contentFull(entry, width);
    assert.strictEqual(full[0].text, '{');
    assert(full.some((l) => l.text.includes('"other"')));
  });

  test('unknown decorator handles null/undefined entries', () => {
    const deco = getDecorator('unknown');

    // Test null entry
    const headerNull = deco.headerLine(null);
    assert.strictEqual(headerNull.text, 'No timestamp [UNKNOWN]');
    assert.strictEqual(headerNull.icon, TRACE_ICONS.unknown);
    assert.strictEqual(headerNull.color, 'gray');

    const compactNull = deco.contentCompact(null, width);
    assert.strictEqual(compactNull.text, 'No entry data');
    assert.strictEqual(compactNull.color, 'gray');

    const fullNull = deco.contentFull(null, width);
    assert.strictEqual(fullNull.length, 1);
    assert.strictEqual(fullNull[0].text, 'No entry data');

    // Test undefined entry
    const headerUndef = deco.headerLine(undefined);
    assert.strictEqual(headerUndef.text, 'No timestamp [UNKNOWN]');

    const compactUndef = deco.contentCompact(undefined, width);
    assert.strictEqual(compactUndef.text, 'No entry data');

    const fullUndef = deco.contentFull(undefined, width);
    assert.strictEqual(fullUndef.length, 1);
    assert.strictEqual(fullUndef[0].text, 'No entry data');
  });
});
