import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  isEnterKey,
  isBackKey,
  isExitKey,
} from '../../src/tui/ui-utils/text-utils.js';

describe('input utils', () => {
  test('isEnterKey detects enter', () => {
    assert.ok(isEnterKey({ return: true }));
    assert.ok(!isEnterKey({}));
  });

  test('isBackKey detects escape and b', () => {
    assert.ok(isBackKey('b', {}));
    assert.ok(isBackKey('', { escape: true }));
    assert.ok(!isBackKey('x', {}));
  });

  test('isExitKey combines checks', () => {
    assert.ok(isExitKey('', { return: true }));
    assert.ok(isExitKey('', { escape: true }));
    assert.ok(isExitKey('b', {}));
    assert.ok(!isExitKey('x', {}));
  });
});
