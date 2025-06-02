import { test } from 'node:test';
import assert from 'node:assert';
import { validateProjectNameWithSuggestions } from '../../src/cli/utils/validation.js';

test('project name validation provides helpful suggestions', () => {
  const result = validateProjectNameWithSuggestions('My-Project!');
  assert.strictEqual(result.valid, false);
  assert.ok(result.suggestions.some((s) => s.includes('my-project')));
});
