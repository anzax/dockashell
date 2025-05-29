import { describe, test } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render } from 'ink-testing-library';
import { TraceDetailsView } from '../../src/tui/views/TraceDetailsView.js';

describe('TraceDetailsView mouse wheel', () => {
  test('scrolls content with wheel', async () => {
    process.stdout.rows = 10;
    const longText = 'x'.repeat(200);
    const traces = [
      { trace: { timestamp: '2025-01-01T00:00:00Z', text: longText } },
    ];
    const { stdin, lastFrame } = render(
      React.createElement(TraceDetailsView, {
        traces,
        currentIndex: 0,
        onClose: () => {},
        onNavigate: () => {},
      })
    );
    await new Promise((r) => setTimeout(r, 50));
    const first = lastFrame();
    stdin.write('\x1b[<65;1;3M');
    await new Promise((r) => setTimeout(r, 20));
    const scrolled = lastFrame();
    assert.notStrictEqual(scrolled, first);
  });
});
