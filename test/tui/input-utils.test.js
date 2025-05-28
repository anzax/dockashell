import { describe, test } from 'node:test';
import assert from 'node:assert';
import { isEnterKey, isBackKey, isExitKey } from '../../src/tui/utils/input-utils.js';

describe('input utils', () => {
  test('isEnterKey detects enter', () => {
    assert.ok(isEnterKey({ return: true }));
    assert.ok(!isEnterKey({}));
  });

  test('isBackKey detects escape and q', () => {
    assert.ok(isBackKey('q', {}));
    assert.ok(isBackKey('', { escape: true }));
    assert.ok(!isBackKey('x', {}));
  });

  test('isExitKey combines checks', () => {
    assert.ok(isExitKey('', { return: true }));
    assert.ok(isExitKey('', { escape: true }));
    assert.ok(isExitKey('q', {}));
    assert.ok(!isExitKey('x', {}));
  });
});
