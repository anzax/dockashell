import { describe, test } from 'node:test';
import assert from 'node:assert';
import { parseMouse } from '../../src/tui/hooks/use-mouse-input.js';

describe('parseMouse', () => {
  test('parses wheel events', () => {
    const up = parseMouse('\x1b[<64;1;2M');
    assert.deepStrictEqual(up, {
      code: 64,
      x: 1,
      y: 2,
      isRelease: false,
      wheel: 'up',
      button: undefined,
    });
    const down = parseMouse('\x1b[<65;1;2M');
    assert.strictEqual(down.wheel, 'down');
  });

  test('parses button press', () => {
    const ev = parseMouse('\x1b[<0;10;5M');
    assert.strictEqual(ev.button, 'left');
    assert.strictEqual(ev.isRelease, false);
    assert.strictEqual(ev.x, 10);
    assert.strictEqual(ev.y, 5);
  });
});
