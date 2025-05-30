import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  validateProjectName,
  textResponse,
} from '../../src/mcp/tools/helpers.js';

describe('helpers', () => {
  test('validateProjectName accepts valid name', () => {
    assert.doesNotThrow(() => validateProjectName('proj'));
  });

  test('validateProjectName rejects invalid name', () => {
    assert.throws(
      () => validateProjectName(''),
      /Project name must be a non-empty string/
    );
    assert.throws(
      () => validateProjectName(null),
      /Project name must be a non-empty string/
    );
  });

  test('textResponse returns expected structure', () => {
    const res = textResponse('hi');
    assert.deepStrictEqual(res, { content: [{ type: 'text', text: 'hi' }] });
  });
});
