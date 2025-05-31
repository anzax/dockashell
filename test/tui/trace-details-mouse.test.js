import { describe, test } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render } from 'ink-testing-library';
import { resetTraceSelection } from '../../src/tui/stores/trace-selection-store.js';
import { TraceDetailsView } from '../../src/tui/views/trace-details-view.js';

describe('TraceDetailsView', () => {
  test('renders without details state', async () => {
    resetTraceSelection();
    const { lastFrame } = render(React.createElement(TraceDetailsView));

    await new Promise((r) => setTimeout(r, 50));

    // Should show "No details state" message when no details are open
    const output = lastFrame();
    assert.ok(output.includes('No details state'));
  });
});
