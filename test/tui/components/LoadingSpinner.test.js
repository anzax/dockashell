import { describe, test } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render } from 'ink-testing-library';
import { LoadingSpinner } from '../../../src/tui/components/LoadingSpinner.js';

describe('LoadingSpinner', () => {
  test('renders label with spinner', () => {
    const { lastFrame } = render(
      React.createElement(LoadingSpinner, { label: 'Loading', type: 'dots' })
    );
    assert.ok(lastFrame().includes('Loading'));
  });
});

describe('loading states with spinners', () => {
  test('supports custom spinner type', () => {
    const { lastFrame } = render(
      React.createElement(LoadingSpinner, { label: 'Work', type: 'arc' })
    );
    assert.ok(lastFrame().includes('Work'));
  });
});
