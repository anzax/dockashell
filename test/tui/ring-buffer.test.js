import { describe, test } from 'node:test';
import assert from 'node:assert';
import { RingBuffer } from '../../src/tui/utils/ring-buffer.js';

describe('RingBuffer', () => {
  test('maintains fixed capacity', () => {
    const buf = new RingBuffer(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    assert.deepStrictEqual(buf.toArray(), [1, 2, 3]);
    buf.push(4);
    assert.deepStrictEqual(buf.toArray(), [2, 3, 4]);
    assert.strictEqual(buf.size, 3);
  });

  test('clear resets buffer', () => {
    const buf = new RingBuffer(2);
    buf.push('a');
    buf.push('b');
    buf.clear();
    assert.deepStrictEqual(buf.toArray(), []);
    assert.strictEqual(buf.size, 0);
  });
});
