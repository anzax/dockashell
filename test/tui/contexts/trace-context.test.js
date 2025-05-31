import { test, describe } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { useTraceSelection } from '../../../src/tui/contexts/trace-context.js';
import {
  dispatch,
  resetTraceSelection,
} from '../../../src/tui/stores/trace-selection-store.js';

describe('TraceContext', () => {
  test('should provide default values', () => {
    function TestComponent() {
      const { selectedIndex, selectedTimestamp, detailsState } =
        useTraceSelection();
      return React.createElement(
        Text,
        null,
        `${selectedIndex},${selectedTimestamp || 'null'},${detailsState ? 'open' : 'closed'}`
      );
    }

    resetTraceSelection();
    const { lastFrame } = render(React.createElement(TestComponent));

    assert.strictEqual(lastFrame(), '0,null,closed');
  });

  test('should expose state and dispatch', () => {
    function TestComponent() {
      const ctx = useTraceSelection();
      const hasProps = ctx && ctx.state && typeof ctx.dispatch === 'function';
      return React.createElement(Text, null, hasProps ? 'ok' : 'fail');
    }

    const { lastFrame } = render(React.createElement(TestComponent));

    assert.strictEqual(lastFrame(), 'ok');
  });

  test('should handle empty restore selection', () => {
    function TestComponent() {
      const {
        state: { selectedIndex },
      } = useTraceSelection();

      React.useEffect(() => {
        dispatch({ type: 'restore-selection', traces: [] });
        dispatch({ type: 'restore-selection', traces: null });
      }, []);

      return React.createElement(Text, null, `index-${selectedIndex}`);
    }

    resetTraceSelection();
    const { lastFrame } = render(React.createElement(TestComponent));

    assert.strictEqual(lastFrame(), 'index-0');
  });
});
